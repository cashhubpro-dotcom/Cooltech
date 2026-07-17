// utils/contractPdf.js
import PDFDocument from 'pdfkit';

export function buildContractPDF(contract, { companyName = 'CoolTech AC Services' } = {}) {
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
    doc.fontSize(12).fillColor('#555').text('Service Contract', { align: 'center' });
    doc.moveDown();

    doc.fillColor('#000').fontSize(10);
    doc.text(`Contract ID: ${contract.contractId}`);
    doc.text(`Title: ${contract.title}`);
    doc.text(`Type: ${contract.type}`);
    doc.text(`Customer: ${contract.customer}`);
    if (contract.contact) doc.text(`Contact: ${contract.contact}`);
    if (contract.phone) doc.text(`Phone: ${contract.phone}`);
    doc.text(`Status: ${contract.status}`);
    doc.moveDown();

    doc.fontSize(12).text('Term', { underline: true });
    doc.fontSize(10);
    doc.text(`Start Date: ${date(contract.startDate)}`);
    doc.text(`End Date: ${contract.noDueDate ? 'No fixed end date' : date(contract.endDate)}`);
    doc.text(`Auto-Renew: ${contract.autoRenew ? 'Yes' : 'No'}`);
    if (contract.nextVisitDate) doc.text(`Next Visit: ${date(contract.nextVisitDate)}`);
    doc.moveDown();

    doc.fontSize(12).text('Value', { underline: true });
    doc.fontSize(10);
    doc.text(`Contract Value: ${money(contract.value)}`);
    if (contract.paymentTerms) doc.text(`Payment Terms: ${contract.paymentTerms}`);
    doc.moveDown();

    if (contract.plan || contract.visitsPerYear || contract.acUnitsCovered || contract.acBrand) {
      doc.fontSize(12).text('AMC Plan Details', { underline: true });
      doc.fontSize(10);
      if (contract.plan) doc.text(`Plan: ${contract.plan}`);
      if (contract.visitsPerYear) doc.text(`Visits Per Year: ${contract.visitsPerYear}`);
      if (contract.acUnitsCovered) doc.text(`AC Units Covered: ${contract.acUnitsCovered}`);
      if (contract.acBrand) doc.text(`AC Brand: ${contract.acBrand}`);
      if (contract.acCapacity) doc.text(`AC Capacity: ${contract.acCapacity}`);
      doc.moveDown();
    }

    if (contract.terms) {
      doc.fontSize(12).text('Terms & Conditions', { underline: true });
      doc.fontSize(10).text(contract.terms);
      doc.moveDown();
    }

    if (contract.clauseList?.length) {
      doc.fontSize(12).text('Clauses', { underline: true });
      doc.fontSize(10);
      contract.clauseList.forEach((c, i) => doc.text(`${i + 1}. ${c.text}`));
      doc.moveDown();
    }

    if (contract.signed) {
      doc.fontSize(10).fillColor('#1a7f37').text(`Signed on ${date(contract.signedDate)} by ${(contract.signatories || []).join(', ') || 'client'}.`);
      doc.fillColor('#000');
      doc.moveDown();
    }

    doc.fontSize(8).fillColor('#888').text(
      'This is a system-generated copy of the contract on file.',
      { align: 'center' }
    );

    doc.end();
  });
}