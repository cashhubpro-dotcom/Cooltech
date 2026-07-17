import Job from '../models/Job.js';
import { buildServiceReportPDF } from '../utils/serviceReportPdf.js';

// A client "report" is a completed service Job — the checklist, technician
// remarks, photos, and rating already captured on the Job *are* the report.
// There's no separate stored document; this exposes completed jobs
// read-only, scoped to the logged-in client's own customer record.
const baseFilter = (req) => ({
  customer: req.user.customer,
  status: { $in: ['completed', 'invoiced'] },
  isDeleted: { $ne: true },
});

/**
 * GET /api/client-portal/me/reports
 * query: page, limit, q (matches jobId, type, or AC unit)
 */
export async function listMyReports(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const { q } = req.query;

    const filter = baseFilter(req);
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ jobId: rx }, { type: rx }, { ac: rx }];
    }

    const docs = await Job.find(filter)
      .select('jobId type ac techName completedAt status rating checklist photos')
      .sort({ completedAt: -1 })
      .lean();

    const total = docs.length;
    const start = (page - 1) * limit;
    const data = docs.slice(start, start + limit);

    res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/client-portal/me/reports/:id
 */
export async function getMyReport(req, res) {
  try {
    const job = await Job.findOne({ _id: req.params.id, ...baseFilter(req) }).lean();
    if (!job) return res.status(404).json({ message: 'Report not found.' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * GET /api/client-portal/me/reports/:id/download
 * Streams a generated PDF summary of the completed job.
 */
export async function downloadMyReport(req, res) {
  try {
    const job = await Job.findOne({ _id: req.params.id, ...baseFilter(req) }).lean();
    if (!job) return res.status(404).json({ message: 'Report not found.' });

    const pdfBuffer = await buildServiceReportPDF(job);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="report-${job.jobId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ message: err.message });
  }
}
