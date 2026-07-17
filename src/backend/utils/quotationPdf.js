// utils/quotationPdf.js
import PDFDocument from 'pdfkit';

export function buildQuotationPDF(quot, { companyName = 'CoolTech AC Services' } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
    const date = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#555').text('Quotation', { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Quotation No: ${quot.quotId}`);
    doc.text(`Type: ${quot.type}`);
    doc.text(`Customer: ${quot.customerName}`);
    if (quot.contact) doc.text(`Contact: ${quot.contact}`);
    if (quot.phone) doc.text(`Phone: ${quot.phone}`);
    if (quot.address) doc.text(`Address: ${quot.address}`);
    doc.text(`Status: ${quot.status}`);
    doc.text(`Valid Until: ${date(quot.validUntil)}`);
    doc.moveDown();

    if (quot.items?.length) {
      doc.fontSize(12).text('Items', { underline: true });
      doc.fontSize(10);
      const colX = { desc: 50, qty: 300, rate: 370, amount: 460 };
      const y0 = doc.y;
      doc.text('Description', colX.desc, y0);
      doc.text('Qty', colX.qty, y0);
      doc.text('Rate', colX.rate, y0);
      doc.text('Amount', colX.amount, y0);
      doc.moveDown(0.5);
      quot.items.forEach((item) => {
        const y = doc.y;
        doc.text(item.desc || '-', colX.desc, y, { width: 240 });
        doc.text(String(item.qty ?? '-'), colX.qty, y);
        doc.text(money(item.rate), colX.rate, y);
        doc.text(money(item.amount), colX.amount, y);
        doc.moveDown(0.3);
      });
      doc.moveDown();
    }

    doc.fontSize(10);
    doc.text(`Subtotal: ${money(quot.subtotal)}`, { align: 'right' });
    if (quot.discount) doc.text(`Discount: ${money(quot.discount)}`, { align: 'right' });
    doc.text(`GST: ${money(quot.gst)}`, { align: 'right' });
    doc.fontSize(12).text(`Total: ${money(quot.total)}`, { align: 'right' });
    doc.moveDown();

    // Arbitrary label/value pairs picked up from an imported source document
    // (e.g. "Delivery Within", "PO Number") that don't map to a fixed column.
    if (quot.fields?.length) {
      doc.fontSize(12).text('Additional Details', { underline: true });
      doc.fontSize(10);
      quot.fields.forEach((f) => doc.text(`${f.label}: ${f.value}`));
      doc.moveDown();
    }

    if (quot.notes) {
      doc.fontSize(12).text('Notes', { underline: true });
      doc.fontSize(10).text(quot.notes);
      doc.moveDown();
    }

    if (quot.terms) {
      doc.fontSize(12).text('Terms', { underline: true });
      doc.fontSize(10).text(quot.terms);
      doc.moveDown();
    }

    doc.fontSize(8).fillColor('#888').text(
      'This is a system-generated quotation.',
      { align: 'center' }
    );

    doc.end();
  });
}