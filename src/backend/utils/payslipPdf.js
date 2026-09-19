// utils/payslipPdf.js
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Looks for a logo file sitting right next to this module (utils/logo.png,
// utils/logo.jpg, or utils/logo.jpeg) so buildPayslipPDF picks it up with
// zero configuration — matches where it was actually dropped. An explicit
// logoPath argument still overrides this.
function findDefaultLogo() {
  for (const name of ['logo.png', 'logo.jpg', 'logo.jpeg']) {
    const candidate = path.join(__dirname, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

// Shared by controllers/payrollController.js (admin zip download) and
// routes/technicianPortal.routes.js (technician single-file download) so
// the two surfaces can never drift into rendering different payslips for
// the same PayrollRun doc.

// ── Visual language — matches the client-portal quotation template
// (LetterDocView in QuotationsPage.jsx): navy header bars on bordered
// tables, and a solid brand-orange block for the headline total. ──────────
const NAVY   = '#1a2e5c';
const BORDER = '#1a2e5c';
const BRAND  = '#F0652D';

const inr = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

// Draws one table row: fills each cell's background (if given), strokes
// its border, then writes its text — in that order, so fill never paints
// over a border or a border over text. Returns the y just below the row,
// so callers thread it straight into the next call.
function drawRow(doc, { x, y, colWidths, cells, aligns = [], rowHeight = 20, fontSize = 9, bold = false, color = '#111', fillBg = null, valign = 'middle' }) {
  let cx = x;
  colWidths.forEach((w) => {
    if (fillBg) doc.rect(cx, y, w, rowHeight).fill(fillBg);
    doc.rect(cx, y, w, rowHeight).lineWidth(0.6).strokeColor(BORDER).stroke();
    cx += w;
  });

  cx = x;
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize).fillColor(color);
  const textY = valign === 'middle' ? y + (rowHeight - fontSize) / 2 - 1 : y + 6;
  cells.forEach((c, i) => {
    doc.text(String(c), cx + 8, textY, { width: colWidths[i] - 16, align: aligns[i] || 'left' });
    cx += colWidths[i];
  });

  return y + rowHeight;
}

// A full table: one header row (navy bg, white bold text) + data rows.
// headerAligns controls the header cells only; rowAligns controls the data
// rows and defaults to headerAligns when omitted (right for a right-aligned
// AMOUNT column, etc.) — pass rowAligns explicitly when the header should be
// centered but the data itself should stay left-aligned, as in a boxed
// key/value details table.
function drawTable(doc, { x, y, colWidths, headerCells, headerAligns, rowAligns, rows, rowHeight = 20, fontSize = 9 }) {
  const dataAligns = rowAligns || headerAligns;
  let curY = drawRow(doc, {
    x, y, colWidths, cells: headerCells, aligns: headerAligns,
    rowHeight, fontSize, bold: true, color: '#fff', fillBg: NAVY,
  });
  rows.forEach((r) => {
    curY = drawRow(doc, {
      x, y: curY, colWidths, cells: r.cells, aligns: r.aligns || dataAligns,
      rowHeight, fontSize, bold: !!r.bold, color: r.color || '#111', fillBg: r.fillBg || null,
    });
  });
  return curY;
}

export function buildPayslipPDF(run, { companyName = 'CoolTech AC Services', companyTagline = 'AC Sales · Service · Installation & Maintenance', companyAddress = '', logoPath = null, technicianMeta = {} } = {}) {
  const resolvedLogoPath = logoPath || findDefaultLogo();
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left     = doc.page.margins.left;
    const right    = doc.page.width - doc.page.margins.right;
    const contentW = right - left;

    // Thin brand accent strip across the very top of the page.
    doc.rect(0, 0, doc.page.width, 6).fill(BRAND);

    // ── Letterhead — mirrors the quotation's actual header: a two-column
    // row (tagline + address on the left, logo on the right), then
    // Date / SUBJECT directly below it. No centered title, no divider —
    // the quotation template doesn't have either. ──────────────────────────
    let y = 40;
    const logoColW = 140;
    const textColW = contentW - logoColW - 10;

    doc.font('Helvetica').fontSize(9).fillColor('#333')
      .text(companyTagline, left, y, { width: textColW });
    if (companyAddress) {
      doc.fontSize(8).fillColor('#666')
        .text(companyAddress, left, doc.y + 2, { width: textColW });
    }

    const logoX = right - logoColW;
    if (resolvedLogoPath) {
      // Real logo file, found on disk — matches the quotation's <Logo />.
      try {
        doc.image(resolvedLogoPath, logoX, y, { fit: [logoColW, 40] });
      } catch {
        doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY)
          .text(companyName, logoX, y, { width: logoColW, align: 'right' });
      }
    } else {
      // No logo file wired up yet — bold company name stands in for it,
      // right-aligned in the same slot the quotation's logo occupies.
      doc.font('Helvetica-Bold').fontSize(13).fillColor(NAVY)
        .text(companyName, logoX, y, { width: logoColW, align: 'right' });
    }

    y = Math.max(doc.y, y + 40) + 12;

    // Date + subject line — mirrors the quotation's "Date / SUBJECT" block.
    const today = new Date().toLocaleDateString('en-IN');
    doc.font('Helvetica').fontSize(9).fillColor('#333')
      .text(`Date: ${today}`, left, y);
    y += 16;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#000')
      .text(`SUBJECT: PAYSLIP FOR ${String(run.period || '').toUpperCase()}`, left, y);
    y += 15;
    doc.font('Helvetica').fontSize(9).fillColor('#555')
      .text(`Payslip No: ${run.runId || '-'}`, left, y);
    y += 20;

    // ── Company / Employee details (boxed, navy header — like Vendor/Client) ─
    const halfW = contentW / 2;
    const infoRows = [
      [`Company: ${companyName}`, `Name: ${run.techName || '-'}`],
      [`Pay Period: ${run.period || '-'}`, `Employee ID: ${technicianMeta.techId || '-'}`],
      [`Payment Mode: ${run.paymentMode || '-'}`, `Role: ${technicianMeta.role || '-'}`],
      [`Cut-off Date: ${run.cutoffDate ? new Date(run.cutoffDate).toLocaleDateString('en-IN') : '-'}`, `Bank Account: ${technicianMeta.bankAccount || '-'}`],
    ];
    y = drawTable(doc, {
      x: left, y, colWidths: [halfW, halfW],
      headerCells: ['COMPANY DETAILS', 'EMPLOYEE DETAILS'],
      headerAligns: ['center', 'center'],
      rowAligns: ['left', 'left'],
      rows: infoRows.map(([l, r]) => ({ cells: [l, r] })),
      rowHeight: 20, fontSize: 9,
    });
    y += 14;

    // Attendance note bar — only when this run is attendance-linked.
    if (run.totalDays != null) {
      doc.rect(left, y, contentW, 22).fill('#FFFBEB');
      doc.rect(left, y, contentW, 22).lineWidth(0.6).strokeColor('#FDE68A').stroke();
      doc.font('Helvetica').fontSize(9).fillColor('#92400E')
        .text(`Days Worked: ${run.presentDays ?? '-'} / ${run.totalDays}    ·    Absent: ${run.absentDays ?? 0}`, left + 8, y + 6);
      y += 22 + 14;
    }

    // ── Earnings table ────────────────────────────────────────────────────
    const earnRows = [
      { cells: ['Basic Salary', inr(run.basic)] },
      { cells: ['HRA (House Rent Allowance)', inr(run.hra)] },
      { cells: ['Travel Allowance', inr(run.travel)] },
    ];
    if (run.incentive)   earnRows.push({ cells: ['Performance Incentive', inr(run.incentive)], color: '#B45309' });
    if (run.uniformAllw) earnRows.push({ cells: ['Uniform Allowance', inr(run.uniformAllw)] });
    if (run.toolAllw)    earnRows.push({ cells: ['Tool & Equipment Allowance', inr(run.toolAllw)] });
    if (run.overtime)    earnRows.push({ cells: ['Overtime Pay', inr(run.overtime)], color: '#15803D' });
    earnRows.push({ cells: ['GROSS EARNINGS', inr(run.gross)], bold: true, fillBg: '#F0F9FF' });

    y = drawTable(doc, {
      x: left, y, colWidths: [contentW * 0.7, contentW * 0.3],
      headerCells: ['EARNINGS', 'AMOUNT'],
      headerAligns: ['left', 'right'],
      rows: earnRows,
      rowHeight: 20, fontSize: 9,
    });
    y += 14;

    // ── Deductions table ──────────────────────────────────────────────────
    const dedRows = [
      { cells: ['Provident Fund (PF)', inr(run.pf)], color: '#B91C1C' },
    ];
    if (run.tds)     dedRows.push({ cells: ['TDS (Tax Deducted at Source)', inr(run.tds)], color: '#B91C1C' });
    if (run.advance) dedRows.push({ cells: ['Advance Recovery', inr(run.advance)], color: '#B91C1C' });
    if (run.lop)     dedRows.push({ cells: [`LOP — ${run.absentDays || 0} day${run.absentDays === 1 ? '' : 's'}`, inr(run.lop)], color: '#B91C1C' });
    const totalDeductions = (run.pf || 0) + (run.tds || 0) + (run.advance || 0) + (run.lop || 0);
    dedRows.push({ cells: ['TOTAL DEDUCTIONS', inr(totalDeductions)], bold: true, color: '#B91C1C', fillBg: '#FEF2F2' });

    y = drawTable(doc, {
      x: left, y, colWidths: [contentW * 0.7, contentW * 0.3],
      headerCells: ['DEDUCTIONS', 'AMOUNT'],
      headerAligns: ['left', 'right'],
      rows: dedRows,
      rowHeight: 20, fontSize: 9,
    });
    y += 16;

    // ── Net pay — solid brand block, mirrors the quotation's total card ───
    const netBoxH = 42;
    doc.rect(left, y, contentW, netBoxH).fill(BRAND);
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#fff')
      .text('NET PAY (TAKE HOME)', left + 14, y + 9);
    doc.font('Helvetica').fontSize(8).fillColor('#FFE8DA')
      .text(technicianMeta.bankAccount || 'Bank details not on file', left + 14, y + 24);
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#fff')
      .text(inr(run.net), left, y + 10, { width: contentW - 14, align: 'right' });
    y += netBoxH + 24;

    // ── Footer ────────────────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(8).fillColor('#888')
      .text('This is a system-generated payslip and does not require a signature.', left, y, { width: contentW, align: 'center' });

    doc.end();
  });
}