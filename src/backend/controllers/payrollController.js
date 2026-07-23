// controllers/payrollController.js
import PayrollRun from '../models/Payroll.js';
import Technician from '../models/Technician.js';
import { AdvanceIncentive } from '../models/extendedModels.js';
import { Expense } from '../models/index.js'
import { Attendance } from '../models/hrModels.js';
import TimeLog from '../models/TimeLog.js';
import PayrollSettings from '../models/PayrollSettings.js';
import { getPeriodDateRange } from '../utils/periodRange.js';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// ── Shared calc logic used by both preview and generate ──────────────────────
async function computeRows(technicianIds, period, options = {}) {
  const settings = await PayrollSettings.getSettings();
  const technicians = await Technician.find({ _id: { $in: technicianIds } });
  const range = getPeriodDateRange(period);

  const rows = [];
  for (const tech of technicians) {
    const { basic, hra, travel, pf } = tech.getSalaryStructure(settings);

    // Incentives for this technician + period, approved or paid
    let incentive = 0;
    if (options.incentives !== false) {
      const incentiveDoc = await AdvanceIncentive.findOne({
        technician: tech._id,
        type: 'incentive',
        month: period,
        status: { $in: ['approved', 'paid'] },
        isDeleted: false,
      });
      incentive = incentiveDoc?.amount || 0;
    }

    // ── "Expense claims" checkbox → Expense.date is a real Date field ──────
    let expense = 0;
    if (options.expense && range) {
      const agg = await Expense.aggregate([
        {
          $match: {
            technician: tech._id,
            status: 'approved',
            isDeleted: { $ne: true },
            date: { $gte: range.start, $lte: range.end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      expense = agg[0]?.total || 0;
    }

    // ── "Add timelogs to salary" checkbox → TimeLog.date is a String ───────
    let overtime = 0;
    if (options.timelog && range) {
      const logs = await TimeLog.find({ technician: tech._id });
      const totalHrs = logs.reduce((sum, log) => {
        const d = new Date(log.date);
        if (d >= range.start && d <= range.end) return sum + (log.hrs || 0);
        return sum;
      }, 0);
      overtime = Math.round(totalHrs * (settings.overtimeRatePerHour || 0));
    }

    // ── "Use attendance" checkbox → deduct loss-of-pay for absences ────────
    let lop = 0, presentDays = null, totalDays = null, absentDays = 0;
    if (options.attendance && range) {
      totalDays = Math.round((range.end - range.start) / 86400000) + 1;
      const records = await Attendance.find({
        technician: tech._id,
        date: { $gte: range.start, $lte: range.end },
      });
      const fullAbsent = records.filter(r => r.status === 'absent').length;
      const halfDays = records.filter(r => r.status === 'half_day').length;
      absentDays = fullAbsent + halfDays * 0.5;
      presentDays = totalDays - absentDays;
      const perDayRate = totalDays > 0 ? basic / totalDays : 0;
      lop = Math.round(perDayRate * absentDays);
    }

    const gross = basic + hra + travel + incentive + expense + overtime;

    // Advance recovery — pulled from Technician.advance (outstanding balance)
    let advance = 0;
    if (options.advances) {
      const outstanding = tech.advance || 0;
      if (outstanding > 0) {
        advance = settings.advanceRecoveryMode === 'percent_cap'
          ? Math.min(outstanding, Math.round(gross * (settings.advanceRecoveryCapPercent / 100)))
          : outstanding;
      }
    }

    const net = gross - pf - advance - lop;

    rows.push({
      technician: tech._id.toString(),
      techName: tech.name,
      basic, hra, travel, incentive, expense, overtime,
      lop, presentDays, totalDays, absentDays,
      gross, pf, advance, net,
    });
  }
  return rows;
}

// ── POST /api/payroll/preview ─────────────────────────────────────────────────
export const previewPayroll = async (req, res) => {
  try {
    const { technicianIds, period, options } = req.body;
    if (!technicianIds?.length || !period) {
      return res.status(400).json({ message: 'technicianIds and period are required' });
    }
    const data = await computeRows(technicianIds, period, options);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/payroll/generate ────────────────────────────────────────────────
export const generatePayroll = async (req, res) => {
  try {
    const { technicianIds, period, cycle, paymentMode, cutoffDate, options } = req.body;
    if (!technicianIds?.length || !period || !cycle) {
      return res.status(400).json({ message: 'technicianIds, period and cycle are required' });
    }

    const rows = await computeRows(technicianIds, period, options);

    // Upsert per technician — regenerating an existing period now updates
    // in place instead of throwing E11000 on the unique (technician, period)
    // index. Sequential so the runId pre('save') hook's countDocuments()
    // sees an up-to-date count for each new doc.
    const created = [];
    for (const row of rows) {
      let doc = await PayrollRun.findOne({ technician: row.technician, period });
      const prevAdvance = doc?.advance || 0;
      const advanceDelta = row.advance - prevAdvance;

      const fields = {
        techName: row.techName,
        cycle,
        basic: row.basic,
        hra: row.hra,
        travel: row.travel,
        incentive: row.incentive,
        expense: row.expense,
        overtime: row.overtime,
        lop: row.lop,
        presentDays: row.presentDays,
        totalDays: row.totalDays,
        absentDays: row.absentDays,
        gross: row.gross,
        pf: row.pf,
        advance: row.advance,
        net: row.net,
        paymentMode,
        cutoffDate,
        status: 'generated',
      };

      if (doc) {
        Object.assign(doc, fields);
      } else {
        doc = new PayrollRun({ technician: row.technician, period, ...fields });
      }

      await doc.save();
      created.push(doc);

      // Only deduct the *change* in advance recovered, so regenerating the
      // same period doesn't double-deduct the technician's balance.
      if (advanceDelta !== 0) {
        await Technician.updateOne(
          { _id: row.technician },
          { $inc: { advance: -advanceDelta } }
        );
      }
    }

    res.json({ count: created.length, data: created });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A payroll run for this technician and period already exists.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// Builds a single payslip PDF and resolves to a Buffer (not a stream)
function buildPayslipPDF(run, companyName = 'Alisha Engineering') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#555').text('Payslip', { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Run ID: ${run.runId}`);
    doc.text(`Period: ${run.period}`);
    doc.text(`Technician: ${run.techName}`);
    doc.text(`Payment Mode: ${run.paymentMode || '-'}`);
    doc.text(`Cut-off Date: ${run.cutoffDate ? new Date(run.cutoffDate).toLocaleDateString('en-IN') : '-'}`);
    doc.moveDown();

    doc.fontSize(12).text('Earnings', { underline: true });
    doc.fontSize(10);
    doc.text(`Basic:      ₹${run.basic.toLocaleString('en-IN')}`);
    doc.text(`HRA:        ₹${run.hra.toLocaleString('en-IN')}`);
    doc.text(`Travel:     ₹${run.travel.toLocaleString('en-IN')}`);
    doc.text(`Incentive:  ₹${run.incentive.toLocaleString('en-IN')}`);
    doc.text(`Expense:    ₹${(run.expense || 0).toLocaleString('en-IN')}`);
    doc.text(`Overtime:   ₹${(run.overtime || 0).toLocaleString('en-IN')}`);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Gross Pay:  ₹${run.gross.toLocaleString('en-IN')}`);
    doc.moveDown();

    doc.fontSize(12).text('Deductions', { underline: true });
    doc.fontSize(10);
    doc.text(`PF:         ₹${run.pf.toLocaleString('en-IN')}`);
    doc.text(`LOP:        ₹${(run.lop || 0).toLocaleString('en-IN')}`);
    doc.text(`Advance:    ₹${run.advance.toLocaleString('en-IN')}`);
    doc.moveDown(0.5);

    doc.fontSize(13).fillColor('#1a7f37').text(`Net Pay:    ₹${run.net.toLocaleString('en-IN')}`);
    doc.fillColor('#000');
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#888').text('System-generated payslip.', { align: 'center' });

    doc.end();
  });
}

// POST /api/payroll/payslips   body: { runIds: [...] } — always a zip
export const downloadPayslips = async (req, res) => {
  try {
    const { runIds } = req.body;
    if (!runIds?.length) {
      return res.status(400).json({ message: 'runIds is required' });
    }
    const runs = await PayrollRun.find({ _id: { $in: runIds } });
    if (!runs.length) {
      return res.status(404).json({ message: 'No payroll runs found' });
    }

    const zip = new JSZip();
    for (const run of runs) {
      const pdfBuffer = await buildPayslipPDF(run);
      const safeName = (run.techName || 'technician').replace(/[^a-z0-9]/gi, '_');
      zip.file(`${safeName}-${run.runId}.pdf`, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payslips-${runs[0].period.replace(/\s+/g, '-')}.zip"`
    );
    res.send(zipBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};

// ── NEW — POST /api/payroll/payslips/excel   body: { runIds: [...] } ────────
export const downloadPayslipsExcel = async (req, res) => {
  try {
    const { runIds } = req.body;
    if (!runIds?.length) {
      return res.status(400).json({ message: 'runIds is required' });
    }
    const runs = await PayrollRun.find({ _id: { $in: runIds } }).sort({ techName: 1 });
    if (!runs.length) {
      return res.status(404).json({ message: 'No payroll runs found' });
    }

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Payroll');
    sheet.columns = [
      { header: 'Run ID', key: 'runId', width: 12 },
      { header: 'Technician', key: 'techName', width: 20 },
      { header: 'Period', key: 'period', width: 16 },
      { header: 'Basic', key: 'basic', width: 12 },
      { header: 'HRA', key: 'hra', width: 12 },
      { header: 'Travel', key: 'travel', width: 12 },
      { header: 'Incentive', key: 'incentive', width: 12 },
      { header: 'Expense', key: 'expense', width: 12 },
      { header: 'Overtime', key: 'overtime', width: 12 },
      { header: 'Gross', key: 'gross', width: 14 },
      { header: 'PF', key: 'pf', width: 12 },
      { header: 'LOP', key: 'lop', width: 12 },
      { header: 'Advance', key: 'advance', width: 12 },
      { header: 'Net Pay', key: 'net', width: 14 },
      { header: 'Payment Mode', key: 'paymentMode', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
    ];
    sheet.getRow(1).font = { bold: true };
    runs.forEach(r => sheet.addRow(r.toObject()));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payroll-${runs[0].period.replace(/\s+/g, '-')}.xlsx"`
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};

// GET /api/payroll/runs?period=March%202026
export const listPayrollRuns = async (req, res) => {
  try {
    const { period } = req.query;
    if (!period) {
      return res.status(400).json({ message: 'period query param is required, e.g. "March 2026"' });
    }

    const runs = await PayrollRun.find({ period, isDeleted: { $ne: true } })
      .populate('technician', 'techId name role bankAccount')
      .sort({ techName: 1 });

    const year = period.trim().split(' ').pop();
    let ytdByTech = {};
    if (/^\d{4}$/.test(year)) {
      const ytdAgg = await PayrollRun.aggregate([
        { $match: { isDeleted: { $ne: true }, period: { $regex: `${year}$` } } },
        { $group: { _id: '$technician', ytdGross: { $sum: '$gross' } } },
      ]);
      ytdByTech = Object.fromEntries(ytdAgg.map((r) => [r._id.toString(), r.ytdGross]));
    }

    const data = runs.map((r) => ({
      ...r.toObject(),
      ytdGross: ytdByTech[r.technician?._id?.toString()] || 0,
    }));

    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/payroll/runs/:id/pay
export const markPayrollRunPaid = async (req, res) => {
  try {
    const run = await PayrollRun.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { status: 'paid' },
      { new: true }
    ).populate('technician', 'techId name role bankAccount');

    if (!run) return res.status(404).json({ message: 'Payroll run not found.' });
    res.json({ data: run });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/payroll/runs/:id/download — single payslip PDF (not zipped)
export const downloadSingleRun = async (req, res) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('technician', 'techId role bankAccount');
    if (!run) return res.status(404).json({ message: 'Payroll run not found.' });

    // Fixed: buildPayslipPDF's 2nd param is companyName (a string), not an
    // options object — previously an object was passed here, which would
    // have rendered "[object Object]" as the company name on the PDF.
    const pdfBuffer = await buildPayslipPDF(run);

    const safeName = (run.techName || 'technician').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${safeName}-${run.period.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};