// utils/invoicePdf.js
import PDFDocument from 'pdfkit';

export function buildInvoicePDF(invoice, { companyName = 'CoolTech AC Services' } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const money = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#555').text('Invoice', { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Invoice No: ${invoice.invoiceNo}`);
    if (invoice.subject) doc.text(`Subject: ${invoice.subject}`);
    doc.text(`Customer: ${invoice.customer}`);
    doc.text(`Date: ${invoice.date || '-'}`);
    doc.text(`Due Date: ${invoice.dueDate || '-'}`);
    doc.text(`Status: ${invoice.paid ? 'Paid' : invoice.computedStatus || invoice.status}`);
    doc.moveDown();

    if (invoice.items?.length) {
      doc.fontSize(12).text('Items', { underline: true });
      doc.fontSize(10);
      const colX = { name: 50, qty: 280, rate: 340, gst: 410, amount: 470 };
      const y0 = doc.y;
      doc.text('Item', colX.name, y0);
      doc.text('Qty', colX.qty, y0);
      doc.text('Rate', colX.rate, y0);
      doc.text('GST%', colX.gst, y0);
      doc.text('Amount', colX.amount, y0);
      doc.moveDown(0.5);
      invoice.items.forEach((item) => {
        const y = doc.y;
        const amount = (item.qty || 0) * (item.rate || 0);
        doc.text(item.name || '-', colX.name, y, { width: 220 });
        doc.text(String(item.qty ?? '-'), colX.qty, y);
        doc.text(money(item.rate), colX.rate, y);
        doc.text(`${item.gst ?? 0}%`, colX.gst, y);
        doc.text(money(amount), colX.amount, y);
        doc.moveDown(0.3);
      });
      doc.moveDown();
    }

    doc.fontSize(10);
    doc.text(`Subtotal: ${money(invoice.subtotal)}`, { align: 'right' });
    doc.text(`GST: ${money(invoice.gstAmount)}`, { align: 'right' });
    doc.fontSize(12).text(`Total: ${money(invoice.total)}`, { align: 'right' });
    doc.moveDown();

    if (invoice.notes) {
      doc.fontSize(12).text('Notes', { underline: true });
      doc.fontSize(10).text(invoice.notes);
      doc.moveDown();
    }

    if (invoice.terms) {
      doc.fontSize(12).text('Terms', { underline: true });
      doc.fontSize(10).text(invoice.terms);
      doc.moveDown();
    }

    doc.fontSize(8).fillColor('#888').text(
      'This is a system-generated invoice.',
      { align: 'center' }
    );

    doc.end();
  });
}