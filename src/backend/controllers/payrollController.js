// controllers/payrollController.js
import PayrollRun from '../models/Payroll.js';
import Technician from '../models/Technician.js';
import { AdvanceIncentive } from '../models/extendedModels.js';
import PayrollSettings from '../models/PayrollSettings.js';
import JSZip from 'jszip';
import PDFDocument from 'pdfkit';

// ── Shared calc logic used by both preview and generate ──────────────────────
async function computeRows(technicianIds, period, options = {}) {
  const settings = await PayrollSettings.getSettings();

  const technicians = await Technician.find({ _id: { $in: technicianIds } });

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

    const gross = basic + hra + travel + incentive;

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

    const net = gross - pf - advance;

    rows.push({
      technician: tech._id.toString(),
      techName: tech.name,
      basic, hra, travel, incentive, gross, pf, advance, net,
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

    // Sequential saves — required so the runId pre('save') hook's
    // countDocuments() sees an up-to-date count for each doc.
    const created = [];
    for (const row of rows) {
      const doc = new PayrollRun({
        technician: row.technician,
        techName: row.techName,
        period,
        cycle,
        basic: row.basic,
        hra: row.hra,
        travel: row.travel,
        incentive: row.incentive,
        gross: row.gross,
        pf: row.pf,
        advance: row.advance,
        net: row.net,
        paymentMode,
        cutoffDate,
        status: 'generated',
      });
      await doc.save();
      created.push(doc);

      // If advance was recovered this run, deduct it from the technician's balance
      if (row.advance > 0) {
        await Technician.updateOne(
          { _id: row.technician },
          { $inc: { advance: -row.advance } }
        );
      }
    }

    res.json({ count: created.length, data: created });
  } catch (err) {
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
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Gross Pay:  ₹${run.gross.toLocaleString('en-IN')}`);
    doc.moveDown();

    doc.fontSize(12).text('Deductions', { underline: true });
    doc.fontSize(10);
    doc.text(`PF:         ₹${run.pf.toLocaleString('en-IN')}`);
    doc.text(`Advance:    ₹${run.advance.toLocaleString('en-IN')}`);
    doc.moveDown(0.5);

    doc.fontSize(13).fillColor('#1a7f37').text(`Net Pay:    ₹${run.net.toLocaleString('en-IN')}`);
    doc.fillColor('#000');
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#888').text('System-generated payslip.', { align: 'center' });

    doc.end();
  });
}

// POST /api/payroll/payslips   body: { runIds: [...] }
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

// ── NEW — powers the admin Salary page ──────────────────────────────────────
// GET /api/payroll/runs?period=March%202026
// Every technician's PayrollRun for one period, in one call — this is what
// admin's SalaryPage.jsx should read instead of the hardcoded salaries_DATA
// mock. Also computes a lightweight year-to-date gross per technician
// (matched by the trailing year in `period`, e.g. "...2026") so the YTD
// column doesn't need its own round trip.
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

// PATCH /api/payroll/runs/:id/pay — one-click mark-as-paid, no confirmation
// step per your call above. Does NOT re-run any calculation — it only flips
// status, same as the existing Salary model's /:id/pay pattern you had.
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

// GET /api/payroll/runs/:id/download — single payslip PDF, admin side.
// downloadPayslips() above always returns a zip (even for one run) — this
// is the single-file equivalent, using the exact same buildPayslipPDF the
// technician portal and the zip download both use, so all three surfaces
// render identically.
export const downloadSingleRun = async (req, res) => {
  try {
    const run = await PayrollRun.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('technician', 'techId role bankAccount');
    if (!run) return res.status(404).json({ message: 'Payroll run not found.' });

    const pdfBuffer = await buildPayslipPDF(run, {
      technicianMeta: {
        techId: run.technician?.techId,
        role: run.technician?.role,
        bankAccount: run.technician?.bankAccount,
      },
    });

    const safeName = (run.techName || 'technician').replace(/[^a-z0-9]/gi, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payslip-${safeName}-${run.period.replace(/\s+/g, '-')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
};