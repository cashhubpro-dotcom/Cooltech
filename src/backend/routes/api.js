import mongoose from 'mongoose';
import express from 'express';
import nodemailer from 'nodemailer';
import Customer from '../models/Customer.js';
import Technician from '../models/Technician.js';
import Job from '../models/Job.js';
import AMC from '../models/AMC.js';
import Quotation from '../models/Quotation.js';
import { Expense, Inventory, Lead, Complaint, Ticket } from '../models/index.js';
import {
  Attendance, Leave, Salary, PurchaseOrder, Supplier,
  Asset, Contract, Reminder, Service
} from '../models/hrModels.js';
import Invoice from '../models/Invoice.model.js';
import { createCRUD } from './crudHelper.js';
import { protect, adminOnly } from '../middleware/auth.js';
import multer from 'multer';
import { notifyAdmins, notifyTechnician, notifyClient } from '../utils/notify.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ── Customers ─────────────────────────────────────────────────────────────────
router.use('/customers', createCRUD(Customer, {
  searchFields: ['name', 'phone', 'email', 'address'],
  filterFields: ['type', 'amc'],
}));

// ── Technicians ───────────────────────────────────────────────────────────────
router.use('/technicians', createCRUD(Technician, {
  searchFields: ['name', 'phone', 'email', 'area'],
  filterFields: ['status', 'role'],
}));

// ── Jobs ──────────────────────────────────────────────────────────────────────
const jobRouter = createCRUD(Job, {
  searchFields: ['jobId', 'customerName', 'address', 'issue', 'techName'],
  filterFields: ['status', 'type', 'priority'],
  populate: ['customer', 'technician'],
  afterCreate: async (job) => {
    await notifyAdmins({
      title: 'New job created',
      message: `${job.jobId} — ${job.customerName || 'Unknown customer'}`,
      type: 'job',
      icon: '🛠️',
      link: `/jobs/${job._id}`,
      sourceId: job._id,
      sourceModel: 'Job',
    });
  },
});

// Extra: assign technician to job
jobRouter.put('/:id/assign', async (req, res) => {
  try {
    const { technicianId, techName } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { technician: technicianId, techName, status: 'assigned' },
      { new: true }
    ).populate('customer technician');
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    // Update technician status
    if (technicianId) {
      await Technician.findByIdAndUpdate(technicianId, { status: 'busy', $inc: { jobs: 1 } });
    }
     await notifyAdmins({
      title: 'Job assigned',
      message: `${job.jobId} assigned to ${techName || 'a technician'}`,
      type: 'job',
      icon: '🛠️',
      link: `/jobs/${job._id}`,
      sourceId: job._id,
      sourceModel: 'Job',
    });
    await notifyTechnician(technicianId, {
      title: 'New job assigned to you',
      message: `${job.jobId} — ${job.customerName || ''}`,
      type: 'job',
      icon: '🛠️',
      link: `/jobs/${job._id}`,
      sourceId: job._id,
      sourceModel: 'Job',
    });
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Extra: complete a job
jobRouter.put('/:id/complete', async (req, res) => {
  try {
    const { remarks, amount, parts } = req.body;
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', completedAt: new Date(), remarks, amount, parts },
      { new: true }
    ).populate('customer technician');
    if (!job) return res.status(404).json({ message: 'Job not found.' });

    if (job.technician) {
      await Technician.findByIdAndUpdate(job.technician, {
        status: 'available',
        $inc: { jobs: -1, completed: 1 },
      });
    }
    if (job.customer) {
      await Customer.findByIdAndUpdate(job.customer, {
        lastService: new Date(),
        $inc: { totalJobs: 1, totalSpent: amount || 0 },
      });
    }
    await notifyAdmins({
      title: 'Job completed',
      message: `${job.jobId} marked complete`,
      type: 'job',
      icon: '✅',
      link: `/jobs/${job._id}`,
      sourceId: job._id,
      sourceModel: 'Job',
    });
    if (job.customer) {
      await notifyClient(job.customer, {
        title: 'Service completed',
        message: `Your service (${job.jobId}) has been completed.`,
        type: 'job',
        icon: '✅',
        link: `/jobs/${job._id}`,
        sourceId: job._id,
        sourceModel: 'Job',
      });
    }
    res.json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// schedule request
router.get('/jobs/reschedule-requests', async (req, res) => {
  try {
    const jobs = await Job.find({ 'rescheduleRequest.status': 'pending', isDeleted: false })
      .populate('customer', 'name phone address')
      .populate('technician', 'name techId phone')
      .sort({ 'rescheduleRequest.requestedDate': 1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

jobRouter.put('/:id/reschedule/respond', async (req, res) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be "approve" or "reject".' });
    }
 
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found.' });
    if (job.rescheduleRequest?.status !== 'pending') {
      return res.status(400).json({ message: 'This job has no pending reschedule request.' });
    }
 
    if (action === 'approve') {
      job.scheduledDate = job.rescheduleRequest.requestedDate;
      job.scheduledTime = job.rescheduleRequest.requestedTime;
      job.rescheduleRequest.status = 'approved';
    } else {
      job.rescheduleRequest.status = 'rejected';
    }
    await job.save();
 
    const populated = await job.populate([
      { path: 'customer', select: 'name phone address' },
      { path: 'technician', select: 'name techId phone' },
    ]);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/jobs', jobRouter);

// ── AMC Contracts ─────────────────────────────────────────────────────────────
router.use('/amc', createCRUD(AMC, {
  searchFields: ['amcId', 'customerName'],
  filterFields: ['status', 'plan'],
  populate: ['customer'],
}));

// ── Quotations ────────────────────────────────────────────────────────────────
const quotRouter = createCRUD(Quotation, {
  searchFields: ['quotId', 'customerName', 'contact'],
  filterFields: ['status', 'type'],
  populate: ['customer'],
  afterCreate: async (quot) => {
    await notifyAdmins({
      title: 'New quotation created',
      message: `${quot.quotId} — ${quot.customerName || ''}`,
      type: 'quotation',
      icon: '📄',
      link: `/quotations/${quot._id}`,
      sourceId: quot._id,
      sourceModel: 'Quotation',
    });
  },
});

// ── UPDATE STATUS ──
quotRouter.patch('/:id/status', async (req, res) => {
  try {
    const { status, note } = req.body;
    const allowed = ['draft', 'sent', 'approved', 'rejected', 'expired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }
    const quot = await Quotation.findByIdAndUpdate(
      req.params.id,
      { status, ...(note ? { statusNote: note } : {}) },
      { new: true }
    );
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });
    if (['approved', 'rejected'].includes(status)) {
      await notifyAdmins({
        title: `Quotation ${status}`,
        message: `${quot.quotId} was ${status}${note ? ` — ${note}` : ''}`,
        type: 'quotation',
        icon: status === 'approved' ? '✅' : '❌',
        link: `/quotations/${quot._id}`,
        sourceId: quot._id,
        sourceModel: 'Quotation',
      });
    }
    res.json(quot);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
// ── SEND EMAIL ──
quotRouter.post('/:id/send-email', async (req, res) => {
  try {
    const quot = await Quotation.findById(req.params.id).lean();
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });
 
    const { toEmail, toName, subject, message } = req.body;
    if (!toEmail) return res.status(400).json({ message: 'Recipient email is required.' });
 
    const transporter = nodemailer.createTransport({
      host:   process.env.MAIL_HOST,
      port:   Number(process.env.MAIL_PORT) || 587,
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    });
 
    const itemRows = (quot.items || []).map((item, i) => `
      <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#fff'}">
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0">${item.desc || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center">${item.qty || ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right">₹${Number(item.rate || 0).toLocaleString('en-IN')}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">₹${Number((item.qty || 0) * (item.rate || 0)).toLocaleString('en-IN')}</td>
      </tr>`).join('');
 
    const htmlBody = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.1)">
  <div style="background:linear-gradient(135deg,#1a2e5c,#2563eb);padding:28px 32px">
    <div style="color:#fff;font-size:22px;font-weight:800">ALISHA ENGINEERING</div>
    <div style="color:#93c5fd;font-size:12px;margin-top:4px">Installation · Maintenance · Repair · AC · Fabrication · Insulation</div>
  </div>
  <div style="padding:32px">
    <p style="margin:0 0 8px;font-size:15px;color:#1e293b">Dear <strong>${toName || quot.customerName || 'Valued Customer'}</strong>,</p>
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.7">${message || `Thank you for your interest. Please find your quotation <strong>${quot.quotId}</strong> for <strong>${quot.type}</strong> services below.`}</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:24px">
      <span style="margin-right:24px"><b style="font-size:11px;color:#64748b;text-transform:uppercase">Quote ID</b><br/><b style="font-size:14px;font-family:monospace;color:#1a2e5c">${quot.quotId}</b></span>
      <span style="margin-right:24px"><b style="font-size:11px;color:#64748b;text-transform:uppercase">Type</b><br/><b style="font-size:14px;color:#1e293b">${quot.type}</b></span>
      <span><b style="font-size:11px;color:#64748b;text-transform:uppercase">Valid Until</b><br/><b style="font-size:14px;color:#1e293b">${quot.validUntil ? new Date(quot.validUntil).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</b></span>
    </div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#1a2e5c">
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:center;width:8%">SR</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:left">DESCRIPTION</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:center;width:10%">QTY</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:right;width:18%">RATE</th>
          <th style="padding:10px 12px;color:#fff;font-size:11px;text-align:right;width:18%">TOTAL</th>
        </tr>
      </thead>
      <tbody>${itemRows || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#94a3b8">No items</td></tr>'}</tbody>
      <tfoot>
        <tr><td colspan="4" style="padding:8px 12px;text-align:right;font-weight:600;border-top:1px solid #e2e8f0">Subtotal</td><td style="padding:8px 12px;text-align:right;font-family:monospace;border-top:1px solid #e2e8f0">₹${Number(quot.subtotal||0).toLocaleString('en-IN')}</td></tr>
        ${quot.gst ? `<tr><td colspan="4" style="padding:6px 12px;text-align:right;font-size:12px;color:#64748b">GST</td><td style="padding:6px 12px;text-align:right;font-family:monospace;color:#64748b">₹${Number(quot.gst).toLocaleString('en-IN')}</td></tr>` : ''}
        <tr style="background:#eff6ff"><td colspan="4" style="padding:10px 12px;text-align:right;font-weight:800;font-size:14px;color:#1a2e5c;border-top:2px solid #bfdbfe">TOTAL</td><td style="padding:10px 12px;text-align:right;font-family:monospace;font-weight:800;font-size:15px;color:#1a2e5c;border-top:2px solid #bfdbfe">₹${Number(quot.total||0).toLocaleString('en-IN')}</td></tr>
      </tfoot>
    </table>
    ${quot.notes ? `<div style="margin-top:20px;padding:14px;background:#fefce8;border:1px solid #fde68a;border-radius:8px"><b style="font-size:11px;color:#92400e">NOTES</b><p style="margin:6px 0 0;font-size:13px;color:#78350f;line-height:1.6">${quot.notes}</p></div>` : ''}
    ${quot.terms ? `<div style="margin-top:12px;padding:14px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px"><b style="font-size:11px;color:#14532d">TERMS & CONDITIONS</b><p style="margin:6px 0 0;font-size:13px;color:#166534;line-height:1.6">${quot.terms}</p></div>` : ''}
    <p style="margin:24px 0 0;font-size:13px;color:#64748b;line-height:1.7">
      For any queries: <strong style="color:#1e293b">Vakil Yadav</strong> · 9724763909 · alishaengineering@gmail.com
    </p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;font-size:11px;color:#94a3b8;text-align:center">
    Alisha Engineering · L.I.G-II-164 G.I.D.C Housing Board · Odahav, Ahmedabad-382415
  </div>
</div></body></html>`;
 
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Alisha Engineering'}" <${process.env.MAIL_FROM}>`,
      to:   `"${toName || quot.customerName}" <${toEmail}>`,
      subject: subject || `Quotation ${quot.quotId} – Alisha Engineering`,
      html: htmlBody,
    });
 
    // Auto-update status to 'sent'
    await Quotation.findByIdAndUpdate(req.params.id, { status: 'sent' });
     if (quot.customer) {
      await notifyClient(quot.customer, {
        title: 'New quotation received',
        message: `Quotation ${quot.quotId} has been sent to you.`,
        type: 'quotation',
        icon: '📄',
        link: `/quotations/${quot._id}`,
        sourceId: quot._id,
        sourceModel: 'Quotation',
      });
    }
    res.json({ message: 'Email sent successfully.', status: 'sent' });
  } catch (err) {
    console.error('[Quotation Email]', err);
    res.status(500).json({ message: err.message || 'Failed to send email.' });
  }
});
 
// ── CONVERT TO JOB ──
quotRouter.post('/:id/convert', async (req, res) => {
  try {
    const quot = await Quotation.findById(req.params.id).lean();
    if (!quot) return res.status(404).json({ message: 'Quotation not found.' });
    if (quot.status === 'approved') {
      return res.status(400).json({ message: 'This quotation has already been converted to a job.' });
    }
 
    const typeMap = { Service:'Service', Installation:'Installation', Repair:'Repair', AMC:'AMC Visit', Other:'Service' };
 
    const job = await Job.create({
      customerName: quot.customerName,
      customer:     quot.customer,
      address:      quot.address || '',
      type:         typeMap[quot.type] || 'Service',
      amount:       quot.total,
      issue:        `From Quotation ${quot.quotId}: ${quot.type}${quot.notes ? '\n' + quot.notes : ''}`,
      remarks:      quot.terms || '',
      quotation:    quot._id,
      status:       'new',
      priority:     'normal',
      parts:        (quot.items || []).map(i => ({
        name: i.desc  || '',
        qty:  Number(i.qty)  || 1,
        cost: Number(i.rate) || 0,
      })),
    });
 
    await Quotation.findByIdAndUpdate(quot._id, { status: 'approved' });
    res.status(201).json({ message: 'Quotation converted to job.', job });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
 
const ALLOWED_TYPES = ['Service', 'Installation', 'Repair', 'AMC', 'Other'];
 
// ── MAGIC IMPORT — AI quotation parser (free Gemini API) ──
quotRouter.post('/magic-import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: 'AI import is not configured (missing GEMINI_API_KEY).' });
    }
 
    const base64Data = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'application/pdf';
 
//     const prompt = `You are extracting structured data from a quotation/estimate document for an AC service company. The document may be typed, scanned, or a photo, and may be messy or handwritten.
 
// Return ONLY valid JSON, no markdown fences, no explanation, matching exactly this shape:
// {
//   "customerName": "",
//   "contact": "",
//   "phone": "",
//   "email": "",
//   "address": "",
//   "type": "Service",
//   "items": [{ "desc": "", "qty": 0, "rate": 0 }],
//   "discount": 0,
//   "gst": 0,
//   "notes": "",
//   "terms": "",
//   "validUntil": ""
// }
 
// Rules:
// - "type" must be exactly one of: Service, Installation, Repair, AMC, Other — pick the closest match to the job described.
// - "items": every line item, with qty and rate as plain numbers (strip ₹ / Rs / commas).
// - "validUntil": ISO date string (YYYY-MM-DD) if a validity/expiry date is present, else "".
// - "gst" and "discount": numeric rupee amounts if shown, else 0.
// - If a field isn't present in the document, use "", [], or 0 — never invent data.
// - Output must be a single JSON object and nothing else.`;
 
    const prompt = `You are extracting structured data from a quotation/estimate document for an AC service company. The document may be typed, scanned, or a photo, and may be messy or handwritten, and may follow any layout or template.

Return ONLY valid JSON, no markdown fences, no explanation, matching exactly this shape:
{
  "customerName": "",
  "contact": "",
  "phone": "",
  "email": "",
  "address": "",
  "type": "Service",
  "items": [{ "desc": "", "qty": 0, "rate": 0 }],
  "discount": 0,
  "gst": 0,
  "taxPercent": 0,
  "notes": "",
  "terms": "",
  "validUntil": "",
  "fields": [{ "label": "", "value": "" }]
}

Rules:
- "type" must be exactly one of: Service, Installation, Repair, AMC, Other — pick the closest match to the job described.
- "items": every line item, with qty and rate as plain numbers (strip ₹ / Rs / $ / commas).
- "validUntil": ISO date string (YYYY-MM-DD) ONLY if an exact expiry/validity date is shown.
- If any validity/expiry info is shown as a duration or relative term instead of an exact date (e.g. "3 Days", "Valid for 15 days", "Valid till end of month"), you MUST NOT put it in "validUntil" — instead add it to "fields" as {"label": "Valid Till", "value": "<exact text as shown>"}. Do not drop this information.
- "gst" and "discount": numeric rupee amounts if shown, else 0. "taxPercent": numeric tax/GST percentage if shown as a %, else 0.
- "fields": capture any OTHER labeled value visible on the document that isn't already covered by the fields above — e.g. "Quote #", "Delivery Within", "Payment Terms", "PO Number", "Reference No", "Prepared By". Use the label exactly as printed. Skip anything already captured above. Max 8 entries, in the order they appear on the document.
- If a field isn't present in the document, use "", [], or 0 — never invent data.
- Output must be a single JSON object and nothing else.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 0.1 },
        }),
      }
    );
 
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();

console.error("Status:", geminiRes.status);
console.error("Status Text:", geminiRes.statusText);
console.error("Gemini Response:", errText);
      return res.status(502).json({ message: 'AI extraction failed. Try again, or fill the quotation manually.' });
    }
 
    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
 
    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      console.error('[Magic Import] Could not parse model output:', rawText);
      return res.status(502).json({ message: 'Could not read this document clearly. Try a clearer scan or fill manually.' });
    }
 
    const items = (Array.isArray(extracted.items) ? extracted.items : []).map((i) => ({
      desc: i.desc || '',
      qty: Number(i.qty) || 0,
      rate: Number(i.rate) || 0,
    }));

    const fields = (Array.isArray(extracted.fields) ? extracted.fields : [])
      .filter(f => f && f.label && f.value)
      .slice(0, 8)
      .map(f => ({ label: String(f.label), value: String(f.value) }));

    // res.json({
    //   customerName: extracted.customerName || '',
    //   contact: extracted.contact || '',
    //   phone: extracted.phone || '',
    //   email: extracted.email || '',
    //   address: extracted.address || '',
    //   type: ALLOWED_TYPES.includes(extracted.type) ? extracted.type : 'Service',
    //   items,
    //   discount: Number(extracted.discount) || 0,
    //   gst: Number(extracted.gst) || 0,
    //   notes: extracted.notes || '',
    //   terms: extracted.terms || '',
    //   validUntil: extracted.validUntil || '',
    // });

    res.json({
      customerName: extracted.customerName || '',
      contact: extracted.contact || '',
      phone: extracted.phone || '',
      email: extracted.email || '',
      address: extracted.address || '',
      type: ALLOWED_TYPES.includes(extracted.type) ? extracted.type : 'Service',
      items,
      discount: Number(extracted.discount) || 0,
      gst: Number(extracted.gst) || 0,
      taxPercent: Number(extracted.taxPercent) || 0,
      notes: extracted.notes || '',
      terms: extracted.terms || '',
      validUntil: extracted.validUntil || '',
      fields,
      template: 'generic',
    });

  } catch (err) {
    console.error('[Magic Import]', err);
    res.status(500).json({ message: err.message || 'Magic import failed.' });
  }
});

router.use('/quotations', quotRouter);

// ── Payments ──────────────────────────────────────────────────────────────────
// router.use('/payments', createCRUD(Payment, {
//   searchFields: ['paymentId', 'customerName', 'invoiceRef'],
//   filterFields: ['method'],
//   softDelete: false,
// }));

// ── Expenses ──────────────────────────────────────────────────────────────────
const expRouter = createCRUD(Expense, {
  searchFields: ['expenseId', 'description', 'techName'],
  filterFields: ['status', 'category'],
  populate: ['technician'],
});

expRouter.put('/:id/soft-delete', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    res.json(doc);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

expRouter.put('/:id/restore', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(req.params.id, { isDeleted: false }, { new: true });
    res.json(doc);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

expRouter.put('/:id/approve', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

expRouter.put('/:id/reject', async (req, res) => {
  try {
    const doc = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/expenses', expRouter);

// ── Inventory ─────────────────────────────────────────────────────────────────
const invtRouter = createCRUD(Inventory, {
  searchFields: ['name', 'sku', 'category', 'supplier'],
  filterFields: ['category'],
});

// Adjust stock
invtRouter.put('/:id/stock', async (req, res) => {
  try {
    const { adjustment, notes } = req.body; // positive = add, negative = remove
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      { $inc: { qty: adjustment } },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Low stock alert
invtRouter.get('/alerts/low-stock', async (req, res) => {
  try {
    const items = await Inventory.find({
      isDeleted: { $ne: true },
      $expr: { $lte: ['$qty', '$reorderLevel'] },
    });
    res.json({ data: items, total: items.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/inventory', invtRouter);

// ── Leads ─────────────────────────────────────────────────────────────────────
const leadRouter = createCRUD(Lead, {
  searchFields: ['leadId', 'name', 'contact', 'phone', 'email'],
  filterFields: ['stage', 'source', 'temp', 'assignedTo'],
});

// Add activity to lead
leadRouter.post('/:id/activities', async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      {
        $push: { activities: { ...req.body, date: new Date() } },
        lastContact: new Date(),
      },
      { new: true }
    );
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Convert lead → customer
leadRouter.post('/:id/convert', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });

    const customer = await Customer.create({
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      type: lead.type,
    });

    await Lead.findByIdAndUpdate(lead._id, { stage: 'won', convertedTo: customer._id });
    res.status(201).json({ message: 'Lead converted to customer.', customer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Convert lead → Job (Won stage)
leadRouter.post('/:id/convert-to-job', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found.' });
 
    const {
      customerName,
      address,
      type,
      priority,
      scheduledDate,
      scheduledTime,
      ac,
      amount,
      issue,
      note,
    } = req.body;
 
    // 1. Resolve customer — use existing if already linked, else find by phone,
    //    else create a new Customer document from lead data.
    let customerId = lead.customer || null;
 
    if (!customerId) {
      // Try to find an existing customer with same phone
      let existingCustomer = null;
      if (lead.phone) {
        existingCustomer = await Customer.findOne({
          phone:     lead.phone,
          isDeleted: { $ne: true },
        });
      }
 
      if (existingCustomer) {
        customerId = existingCustomer._id;
      } else {
        // Create a fresh customer from lead details
        const newCustomer = await Customer.create({
          name:    lead.name,
          phone:   lead.phone   || '',
          email:   lead.email   || '',
          address: lead.address || '',
          type:    lead.type    || 'Residential',
        });
        customerId = newCustomer._id;
      }
 
      // Link the resolved customer back to the lead for future reference
      await Lead.findByIdAndUpdate(lead._id, { customer: customerId });
    }
 
    // 2. Create the Job document
    const job = await Job.create({
      customer:      customerId,
      customerName:  customerName  || lead.name,
      address:       address       || lead.address || '',
      type:          type          || 'Installation',
      priority:      priority      || 'normal',
      status:        'new',
      ac:            ac            || '',
      issue:         issue
        ? issue
        : `Converted from Lead ${lead.leadId}${note ? '\n' + note : ''}`,
      amount:        Number(amount) || lead.value || 0,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      scheduledTime: scheduledTime || '',
    });
 
    // 3. Mark lead as Won, link the job ID, optionally push activity note
    const leadPatch = {
      stage:       'won',
      convertedTo: job._id,
    };
 
    if (note) {
      leadPatch.$push = {
        activities: {
          type: 'note',
          note: `[Won → Job ${job.jobId}] ${note}`,
          date: new Date(),
          by:   req.user?.name || 'Admin',
        },
      };
    }
 
    await Lead.findByIdAndUpdate(lead._id, leadPatch);
 
    res.status(201).json({ message: 'Lead converted to job.', job });
  } catch (err) {
    console.error('[Lead → Job]', err);
    res.status(500).json({ message: err.message });
  }
});

router.use('/leads', leadRouter);

// ── Complaints ────────────────────────────────────────────────────────────────
const compRouter = createCRUD(Complaint, {
  searchFields: ['complaintId', 'customerName', 'techName', 'description'],
  filterFields: ['status', 'category', 'severity'],
  populate: [
    { path: 'customer', select: 'name phone email' },
    { path: 'technician', select: 'name techId phone' },
    { path: 'job', select: 'jobId' },
  ],
  afterCreate: async (comp) => {
    await notifyAdmins({
      title: 'New complaint',
      message: `${comp.complaintId} — ${comp.customerName || ''}`,
      type: 'urgent',
      icon: '⚠️',
      link: `/complaints/${comp._id}`,
      sourceId: comp._id,
      sourceModel: 'Complaint',
    });
  },
});

// ── Assign technician ──
compRouter.put('/:id/assign', async (req, res) => {
  try {
    const { technicianId, priority, targetResolutionDate, internalNotes } = req.body;
    if (!technicianId) return res.status(400).json({ message: 'technicianId is required.' });

    const tech = await Technician.findById(technicianId);
    if (!tech) return res.status(404).json({ message: 'Technician not found.' });

    const update = {
      technician: technicianId,
      techName: tech.name,
      status: 'in_progress',
    };
    if (priority) update.severity = priority.toLowerCase();
    if (targetResolutionDate) update.targetResolutionDate = new Date(targetResolutionDate);
    if (internalNotes) update.internalNotes = internalNotes;

    const doc = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('customer', 'name phone email')
      .populate('technician', 'name techId phone')
      .populate('job', 'jobId');

    if (!doc) return res.status(404).json({ message: 'Complaint not found.' });

    await notifyAdmins({
      title: 'Complaint assigned',
      message: `${doc.complaintId} assigned to ${tech.name}`,
      type: 'complaint',
      icon: '👤',
      link: `/complaints/${doc._id}`,
      sourceId: doc._id,
      sourceModel: 'Complaint',
    });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

compRouter.put('/:id/resolve', async (req, res) => {
  try {
    const { resolution, customerCommunication, compensation } = req.body;
    if (!resolution?.trim()) return res.status(400).json({ message: 'Resolution notes are required.' });

    const doc = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolution,
        resolvedAt: new Date(),
        ...(customerCommunication ? { customerCommunication } : {}),
        ...(compensation ? { compensation } : {}),
      },
      { new: true }
    ).populate('customer', 'name phone email')
     .populate('technician', 'name techId phone')
     .populate('job', 'jobId');

    if (!doc) return res.status(404).json({ message: 'Complaint not found.' });

    await notifyAdmins({
      title: 'Complaint resolved',
      message: `${doc.complaintId} has been resolved`,
      type: 'complaint',
      icon: '✅',
      link: `/complaints/${doc._id}`,
      sourceId: doc._id,
      sourceModel: 'Complaint',
    });
    if (doc.customer) {
      await notifyClient(doc.customer._id ?? doc.customer, {
        title: 'Your complaint has been resolved',
        message: resolution || `Complaint ${doc.complaintId} resolved.`,
        type: 'complaint',
        icon: '✅',
        link: `/complaints/${doc._id}`,
        sourceId: doc._id,
        sourceModel: 'Complaint',
      });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/complaints', compRouter);

// ── Tickets ───────────────────────────────────────────────────────────────────
const ticketRouter = createCRUD(Ticket, {
  searchFields: ['ticketId', 'customerName', 'subject'],
  filterFields: ['status', 'category', 'priority'],
  populate: [
    { path: 'customer', select: 'customerId name phone email address city' },
    { path: 'job', select: 'jobId' },
  ],
   beforeCreate: async (body) => {
    if (body.customer) {
      const cust = await mongoose.model('Customer').findById(body.customer);
      if (cust) {
        body.customerName = body.customerName || cust.name;
        body.contact = body.contact || cust.email;
        body.phone = body.phone || cust.phone;
      }
    }
    return body;
  },
  afterCreate: async (ticket) => {
    await notifyAdmins({
      title: 'New support ticket',
      message: `${ticket.ticketId} — ${ticket.subject || ''}`,
      type: 'ticket',
      icon: '🎫',
      link: `/tickets/${ticket._id}`,
      sourceId: ticket._id,
      sourceModel: 'Ticket',
    });
  },
});

// Add message to ticket
ticketRouter.post('/:id/messages', async (req, res) => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { ...req.body, time: new Date() } }, updatedAt: new Date() },
      { new: true }
    );
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ticketRouter.put('/:id/resolve', async (req, res) => {
//   try {
//     const doc = await Ticket.findByIdAndUpdate(
//       req.params.id,
//       { status: 'resolved', resolvedAt: new Date() },
//       { new: true }
//     );
//     res.json(doc);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

ticketRouter.put('/:id/resolve', async (req, res) => {
  try {
    let doc = await Ticket.findByIdAndUpdate(
      req.params.id,
      { status: 'resolved', resolvedAt: new Date() },
      { new: true }
    );
    doc = await doc.populate('customer', 'customerId name phone email address city'); // ← add this
    await notifyAdmins({
      title: 'Ticket resolved',
      message: `${doc.ticketId} has been resolved`,
      type: 'ticket',
      icon: '✅',
      link: `/tickets/${doc._id}`,
      sourceId: doc._id,
      sourceModel: 'Ticket',
    });
    if (doc.customer) {
      await notifyClient(doc.customer, {
        title: 'Your ticket has been resolved',
        message: `Ticket ${doc.ticketId} is now resolved.`,
        type: 'ticket',
        icon: '✅',
        link: `/tickets/${doc._id}`,
        sourceId: doc._id,
        sourceModel: 'Ticket',
      });
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/tickets', ticketRouter);
// ── Attendance ────────────────────────────────────────────────────────────────
const attRouter = express.Router();
 
attRouter.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { month, year, technicianId } = req.query;
    const query = {};
    if (technicianId) query.technician = technicianId;
    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      query.date = { $gte: start, $lte: end };
    }
    const data = await Attendance.find(query).populate('technician', 'name techId').sort({ date: 1 });
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 
attRouter.post('/upsert', protect, adminOnly, async (req, res) => {
  try {
    const { technician, date, status, clockIn, clockOut, notes } = req.body;
 
    if (!technician || !date || !status) {
      return res.status(400).json({ message: 'technician, date, and status are required' });
    }
 
    const doc = await Attendance.findOneAndUpdate(
      { technician, date },
      { $set: { status, clockIn, clockOut, notes } },
      { upsert: true, new: true }
    ).populate('technician', 'name role department');
 
    res.json(doc);
  } catch (err) {
    console.error('[Attendance] upsert error:', err);
    res.status(500).json({ message: err.message });
  }
});
 
attRouter.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const doc = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
 
attRouter.delete('/', protect, adminOnly, async (req, res) => {
  try {
    const { technician, date } = req.query;
    if (!technician || !date) {
      return res.status(400).json({ message: 'technician and date query params required' });
    }
    await Attendance.findOneAndDelete({ technician, date });
    res.json({ success: true });
  } catch (err) {
    console.error('[Attendance] delete error:', err);
    res.status(500).json({ message: err.message });
  }
});
 
router.use('/attendance', attRouter);

// ── Leave Management ──────────────────────────────────────────────────────────
const leaveRouter = createCRUD(Leave, {
  searchFields: ['leaveId', 'techName'],
  filterFields: ['status', 'type'],
  softDelete: false,
  populate: ['technician'],
});

leaveRouter.put('/:id/approve', async (req, res) => {
  try {
    const doc = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

leaveRouter.put('/:id/reject', async (req, res) => {
  try {
    const doc = await Leave.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/leaves', leaveRouter);

// ── Salary ────────────────────────────────────────────────────────────────────
const salaryRouter = createCRUD(Salary, {
  searchFields: ['salaryId', 'techName', 'month'],
  filterFields: ['status', 'month'],
  softDelete: false,
  populate: ['technician'],
});

salaryRouter.put('/:id/pay', async (req, res) => {
  try {
    const doc = await Salary.findByIdAndUpdate(
      req.params.id,
      { status: 'paid', paidAt: new Date() },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/salary', salaryRouter);

// ── Purchase Orders ───────────────────────────────────────────────────────────
router.use('/purchase-orders', createCRUD(PurchaseOrder, {
  searchFields: ['poId', 'supplier'],
  filterFields: ['status'],
}));

// ── Suppliers ─────────────────────────────────────────────────────────────────
const supplierLookupStage = {
  $lookup: {
    from: 'purchaseorders', // collection name for the PurchaseOrder model
    let: { supplierName: '$name' },
    pipeline: [
      { $match: { $expr: { $eq: ['$supplier', '$$supplierName'] }, isDeleted: { $ne: true } } },
    ],
    as: 'orders',
  },
};

const supplierComputedFields = {
  $addFields: {
    id: '$_id',
    totalOrders: { $size: '$orders' },
    totalValue:  { $sum: '$orders.total' },
    lastOrder: {
      $max: {
        $map: {
          input: '$orders',
          as: 'o',
          in: { $ifNull: ['$$o.orderedAt', '$$o.createdAt'] },
        },
      },
    },
  },
};

// GET /suppliers — list, enriched with live order/spend stats
router.get('/suppliers', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const suppliers = await Supplier.aggregate([
      supplierLookupStage,
      supplierComputedFields,
      { $project: { orders: 0 } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);
    res.json({ data: suppliers, total: suppliers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /suppliers/stats/summary — KPI card data, computed server-side
// (registered before /:id so "stats" isn't swallowed as an id param)
// GET /suppliers/stats/summary
router.get('/suppliers/stats/summary', async (req, res) => {
  try {
    const [summary] = await Supplier.aggregate([
      { $match: { isDeleted: { $ne: true } } },   // ← add this too, or KPI cards count deleted suppliers
      supplierLookupStage,
      supplierComputedFields,
      {
        $group: {
          _id: null,
          active:         { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalSpend:     { $sum: '$totalValue' },
          totalOrders:    { $sum: '$totalOrders' },
          avgRating:      { $avg: '$rating' },
          supplierCount:  { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);
    res.json(summary || { active: 0, totalSpend: 0, totalOrders: 0, avgRating: 0, supplierCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/suppliers/deleted', async (req, res) => {
  try {
    const data = await Supplier.find({ isDeleted: true }).sort({ createdAt: -1 });
    res.json({ data, total: data.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /suppliers/stats/summary — KPI card data, computed server-side
router.get('/suppliers', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const suppliers = await Supplier.aggregate([
      { $match: { isDeleted: { $ne: true } } },   // ← add this
      supplierLookupStage,
      supplierComputedFields,
      { $project: { orders: 0 } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ]);
    res.json({ data: suppliers, total: suppliers.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET /suppliers/:id — single supplier with computed stats
router.get('/suppliers/:id', async (req, res) => {
  try {
    const [supplier] = await Supplier.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id), isDeleted: { $ne: true } } },  // ← added filter
      supplierLookupStage,
      supplierComputedFields,
      { $project: { orders: 0 } },
    ]);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found.' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST / PUT / DELETE still handled generically
router.use('/suppliers', createCRUD(Supplier, {
  searchFields: ['name', 'contact', 'phone', 'email'],
  filterFields: ['category', 'status'],
  softDelete: true,
}));

// ── Assets ────────────────────────────────────────────────────────────────────
router.use('/assets', createCRUD(Asset, {
  searchFields: ['assetId', 'name', 'regNo', 'serial', 'techName', 'subType'],
  filterFields: ['status', 'assetType'],
  populate: ['assignedTo'],
}));

// ── Contracts ─────────────────────────────────────────────────────────────────
const contractRouter = createCRUD(Contract, {
  searchFields: ['contractId', 'customer', 'title'],
  filterFields: ['status', 'type', 'signed'],
  populate: [],
});

contractRouter.put('/:id/sign', async (req, res) => {
  try {
    const doc = await Contract.findByIdAndUpdate(
      req.params.id,
      { signed: true, signedDate: new Date(), status: 'active' },
      { new: true }
    );
    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Clone ──
contractRouter.post('/:id/clone', async (req, res) => {
  try {
    const original = await Contract.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ message: 'Contract not found.' });

    const {
      _id, contractId, createdAt, updatedAt, __v,
      signed, signedDate, signatories, status, auditLog, nextVisitDate,
      ...rest
    } = original;

    const clone = await Contract.create({
      ...rest,
      title: `${original.title} (Copy)`,
      signed: false,
      signedDate: null,
      signatories: [],
      status: 'draft',
      auditLog: [{ action: 'Cloned', detail: `Cloned from ${contractId}`, by: req.user?.name || 'Admin' }],
    });
    res.status(201).json(clone);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Send for e-signature ──
contractRouter.post('/:id/send-signature', async (req, res) => {
  try {
    const { signatories } = req.body; // [{ name, email }]
    if (!Array.isArray(signatories) || !signatories.length) {
      return res.status(400).json({ message: 'At least one signatory is required.' });
    }
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });

    contract.signatories = signatories.map(s => `${s.name} (PENDING)`);
    contract.status = 'pending_signature';
    contract.auditLog.push({
      action: 'Sent for e-signature',
      detail: signatories.map(s => s.name).join(', '),
      by: req.user?.name || 'Admin',
    });
    await contract.save();

    if (process.env.MAIL_HOST) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.MAIL_HOST,
          port: Number(process.env.MAIL_PORT) || 587,
          secure: false,
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        });
        for (const s of signatories) {
          if (!s.email) continue;
          await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME || 'CoolTech'}" <${process.env.MAIL_FROM}>`,
            to: `"${s.name}" <${s.email}>`,
            subject: `Signature requested: ${contract.title} (${contract.contractId})`,
            html: `<p>Hi ${s.name},</p><p>Please review and sign contract <b>${contract.contractId} – ${contract.title}</b>.</p>`,
          });
        }
      } catch (mailErr) {
        console.error('[Contract e-signature email]', mailErr); // non-fatal — status update already saved
      }
    }
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Mark one signatory as signed ──
contractRouter.put('/:id/signatories/:index/mark-signed', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });
    const idx = Number(req.params.index);
    if (!contract.signatories[idx]) return res.status(404).json({ message: 'Signatory not found.' });

    contract.signatories[idx] = contract.signatories[idx].replace(' (PENDING)', '');
    const allSigned = contract.signatories.every(s => !s.includes('PENDING'));
    if (allSigned) {
      contract.signed = true;
      contract.signedDate = new Date();
      contract.status = 'active';
    }
    contract.auditLog.push({ action: 'Signatory signed', detail: contract.signatories[idx], by: req.user?.name || 'Admin' });
    await contract.save();
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add clause ──
contractRouter.post('/:id/clauses', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Clause text is required.' });
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          clauseList: { text: text.trim(), addedBy: req.user?.name || 'Admin' },
          auditLog: { action: 'Clause added', detail: text.trim(), by: req.user?.name || 'Admin' },
        },
        $inc: { clauses: 1 },
      },
      { new: true }
    );
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Schedule visit ──
contractRouter.put('/:id/schedule-visit', async (req, res) => {
  try {
    const { date, notes } = req.body;
    if (!date) return res.status(400).json({ message: 'Visit date is required.' });
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      {
        nextVisitDate: new Date(date),
        $push: { auditLog: { action: 'Visit scheduled', detail: `${date}${notes ? ' — ' + notes : ''}`, by: req.user?.name || 'Admin' } },
      },
      { new: true }
    );
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Audit trail ──
contractRouter.get('/:id/audit', async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id).select('auditLog contractId title');
    if (!contract) return res.status(404).json({ message: 'Contract not found.' });
    res.json({ data: [...contract.auditLog].reverse(), contractId: contract.contractId, title: contract.title });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.use('/contracts', contractRouter);

// ── Reminders ─────────────────────────────────────────────────────────────────
router.use('/reminders', createCRUD(Reminder, {
  searchFields: ['reminderId', 'title', 'type', 'ac'],
  filterFields: ['status', 'type', 'sent'],
  softDelete: true,
  populate: ['customer'],
  // NewReminderModal submits raw form field names (acUnit/reminderType/
  // sendOption) — map them onto the schema's field names here. `title` is
  // required (shown to the client on their portal), so derive it from the
  // reminder type since the admin form doesn't collect a separate title.
  beforeCreate: async (body) => ({
    customer: body.customer,
    title: body.title ?? body.reminderType ?? body.type ?? 'Service Reminder',
    ac: body.acUnit ?? body.ac ?? '',
    type: body.reminderType ?? body.type ?? 'custom',
    dueDate: body.dueDate,
    lastService: body.lastService,
    sent: body.sendOption === 'Yes – send now',
    status: 'pending',
    description: body.notes ?? '',
  }),
}));

// ── Services / Price List ─────────────────────────────────────────────────────
router.use('/services', createCRUD(Service, {
  searchFields: ['name', 'description', 'category'],
  filterFields: ['category', 'isActive'],
  softDelete: false,
}));

// ── Dashboard Stats ────────────────────────────────────────────────────────
router.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday   = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
 
    const [
      totalJobs, jobsThisMonth, openJobs, completedJobs, todaysJobsCount,
      totalCustomers, activeAMC,
      pendingInvoices, totalRevenue,
      totalTechs, availableTechs,
      openTickets, openLeads,
      pendingQuotesCount,
    ] = await Promise.all([
      Job.countDocuments({ isDeleted: { $ne: true } }),
      Job.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfMonth } }),
      Job.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['new', 'assigned', 'in_progress'] } }),
      Job.countDocuments({ isDeleted: { $ne: true }, status: 'completed', createdAt: { $gte: startOfMonth } }),
      // NEW — jobs actually scheduled for today, which is what the welcome
      // toast's "Today's Jobs" card means (distinct from jobsThisMonth).
      Job.countDocuments({
        isDeleted: { $ne: true },
        scheduledDate: { $gte: startOfToday, $lte: endOfToday },
      }),
      Customer.countDocuments({ isDeleted: { $ne: true } }),
      AMC.countDocuments({ isDeleted: { $ne: true }, status: 'active' }),
      Invoice.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['pending', 'overdue'] } }),
      Invoice.aggregate([
        { $match: { isDeleted: { $ne: true }, status: 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Technician.countDocuments({ isDeleted: { $ne: true }, isActive: true }),
      Technician.countDocuments({ isDeleted: { $ne: true }, status: 'available' }),
      Ticket.countDocuments({ isDeleted: { $ne: true }, status: 'open' }),
      Lead.countDocuments({ isDeleted: { $ne: true }, stage: { $nin: ['won', 'lost'] } }),
      // NEW — quotations still awaiting a decision from the customer.
      Quotation.countDocuments({ isDeleted: { $ne: true }, status: { $in: ['draft', 'sent'] } }),
    ]);
 
    res.json({
      jobs: {
        total: totalJobs,
        thisMonth: jobsThisMonth,
        open: openJobs,
        completedThisMonth: completedJobs,
        todaysJobs: todaysJobsCount, // NEW
      },
      customers: { total: totalCustomers, activeAMC },
      finance: { pendingInvoices, revenueThisMonth: totalRevenue[0]?.total || 0 },
      technicians: { total: totalTechs, available: availableTechs },
      support: { openTickets, openLeads },
      quotations: { pending: pendingQuotesCount }, // NEW
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Users (admin) ─────────────────────────────────────────────────────────────
import User from '../models/User.js';

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ data: users, total: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, rest, { new: true });
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'User deactivated.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
