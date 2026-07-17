// utils/payslipPdf.js
import PDFDocument from 'pdfkit';

// Shared by controllers/payrollController.js (admin zip download) and
// routes/technicianPortal.routes.js (technician single-file download) so
// the two surfaces can never drift into rendering different payslips for
// the same PayrollRun doc.
export function buildPayslipPDF(run, { companyName = 'CoolTech AC Services', technicianMeta = {} } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
    const row = (label, val) => doc.text(`${label}:`.padEnd(26) + money(val));

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#555').text('Payslip', { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Run ID: ${run.runId}`);
    doc.text(`Period: ${run.period}`);
    doc.text(`Technician: ${run.techName}${technicianMeta.techId ? ` (${technicianMeta.techId})` : ''}`);
    if (technicianMeta.role) doc.text(`Role: ${technicianMeta.role}`);
    if (technicianMeta.bankAccount) doc.text(`Bank: ${technicianMeta.bankAccount}`);
    doc.text(`Payment Mode: ${run.paymentMode || '-'}`);
    doc.text(`Cut-off Date: ${run.cutoffDate ? new Date(run.cutoffDate).toLocaleDateString('en-IN') : '-'}`);
    if (run.totalDays != null) {
      doc.text(`Days Worked: ${run.presentDays ?? '-'} / ${run.totalDays}   ·   Absent: ${run.absentDays ?? 0}`);
    }
    doc.moveDown();

    doc.fontSize(12).text('Earnings', { underline: true });
    doc.fontSize(10);
    row('Basic', run.basic);
    row('HRA', run.hra);
    row('Travel', run.travel);
    if (run.incentive) row('Incentive', run.incentive);
    if (run.uniformAllw) row('Uniform Allowance', run.uniformAllw);
    if (run.toolAllw) row('Tool Allowance', run.toolAllw);
    if (run.overtime) row('Overtime', run.overtime);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Gross Pay: ${money(run.gross)}`);
    doc.moveDown();

    doc.fontSize(12).text('Deductions', { underline: true });
    doc.fontSize(10);
    row('PF', run.pf);
    if (run.tds) row('TDS', run.tds);
    if (run.advance) row('Advance Recovery', run.advance);
    if (run.lop) row(`LOP (${run.absentDays || 0} day${run.absentDays === 1 ? '' : 's'})`, run.lop);
    doc.moveDown(0.5);

    doc.fontSize(13).fillColor('#1a7f37').text(`Net Pay: ${money(run.net)}`);
    doc.fillColor('#000');
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#888').text('System-generated payslip.', { align: 'center' });

    doc.end();
  });
}