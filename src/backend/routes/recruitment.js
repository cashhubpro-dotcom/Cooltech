import { createCRUD } from './crudHelper.js';
import JobOpening from '../models/JobOpening.js';

const router = createCRUD(JobOpening, {
  searchFields: ['title', 'dept'],
  filterFields: ['status', 'dept', 'type', 'urgency'],
  softDelete: true,
  defaultSort: { createdAt: -1 },
});

// ── Applicants (embedded sub-resource) ──────────────────────────────────────

// POST /api/recruitment/:id/applicants — add an applicant to a job's pipeline
router.post('/:id/applicants', async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job || job.isDeleted) return res.status(404).json({ message: 'Job not found.' });

    job.applicants.push({ ...req.body, stage: 'Applied' });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/recruitment/:id/applicants/:applicantId
// Used for stage changes, star rating, and recruiter notes — any partial patch.
router.put('/:id/applicants/:applicantId', async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job || job.isDeleted) return res.status(404).json({ message: 'Job not found.' });

    const applicant = job.applicants.id(req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found.' });

    Object.assign(applicant, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/recruitment/:id/applicants/:applicantId — remove from pipeline
// (Applicants are removed outright rather than soft-deleted — only job
// openings need to show up in "Recently Deleted".)
router.delete('/:id/applicants/:applicantId', async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job || job.isDeleted) return res.status(404).json({ message: 'Job not found.' });

    const applicant = job.applicants.id(req.params.applicantId);
    if (!applicant) return res.status(404).json({ message: 'Applicant not found.' });

    applicant.deleteOne();
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;