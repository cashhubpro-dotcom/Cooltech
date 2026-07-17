// utils/serviceReportPdf.js
import PDFDocument from 'pdfkit';

// A "report" shown to the client is a completed Job's service summary —
// checklist, technician notes, rating, AC unit serviced. There's no separate
// stored report document; this renders one on demand from the Job itself.
export function buildServiceReportPDF(job, { companyName = 'CoolTech AC Services' } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text(companyName, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(12).fillColor('#555').text('Service Report', { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Job ID: ${job.jobId}`);
    doc.text(`Type: ${job.type}`);
    doc.text(`AC Unit: ${job.ac || '-'}`);
    doc.text(`Technician: ${job.techName || 'Unassigned'}`);
    doc.text(`Date Completed: ${job.completedAt ? new Date(job.completedAt).toLocaleDateString('en-IN') : '-'}`);
    if (job.address) doc.text(`Address: ${job.address}`);
    doc.moveDown();

    if (job.issue) {
      doc.fontSize(12).text('Reported Issue', { underline: true });
      doc.fontSize(10).text(job.issue);
      doc.moveDown();
    }

    if (job.checklist?.length) {
      doc.fontSize(12).text('Checklist', { underline: true });
      doc.fontSize(10);
      job.checklist.forEach((c) => {
        doc.text(`${c.done ? '[x]' : '[ ]'} ${c.item}`);
      });
      doc.moveDown();
    }

    if (job.remarks) {
      doc.fontSize(12).text("Technician's Remarks", { underline: true });
      doc.fontSize(10).text(job.remarks);
      doc.moveDown();
    }

    if (job.rating) {
      doc.fontSize(10).text(`Customer Rating: ${job.rating}/5${job.ratingComment ? ` — "${job.ratingComment}"` : ''}`);
      doc.moveDown();
    }

    doc.fontSize(8).fillColor('#888').text(
      'This report was generated from job records held by CoolTech AC Services.',
      { align: 'center' }
    );

    doc.end();
  });
}