// routes/technicianAccess.routes.js
// POST /api/technicians — creates a technician and, optionally, an app login (User, role "technician")
// linked through Technician.user, which is what technicianOnly middleware looks up.
// Mounted in server.js BEFORE apiRoutes; all other methods/paths fall through to the generic CRUD.
import express from 'express';
import Technician from '../models/Technician.js';
import User from '../models/User.js';
import { sendTechnicianWelcomeEmail, sendTechnicianWelcomeWhatsApp } from '../utils/clientAccessMail.js';

const router = express.Router();

// Fields where the modal name already equals the schema name.
const DIRECT_FIELDS = [
  'name', 'phone', 'email', 'role', 'status', 'skills', 'certifications',
  'joinDate', 'address', 'salary', 'advance', 'jobsTarget',
  'hra', 'travel', 'pfPercent', 'uniformAllw', 'toolAllw',
  'salutation', 'department', 'employmentType', 'gender', 'dob', 'bloodGroup',
  'maritalStatus', 'nationality', 'religionCategory', 'altPhone', 'personalEmail',
  'street', 'city', 'state', 'country', 'pincode', 'probationEnd', 'reportingTo',
  'dailyAllowance', 'overtimeRate', 'specialization', 'vehicleType', 'notes',
];

// Modal field name → schema field name (schema names are what the technician detail page reads)
const RENAMED_FIELDS = {
  serviceArea:      'area',
  basicSalary:      'salary',
  workShift:        'shift',
  experienceYears:  'experience',
  brandsExpertise:  'brands',
  hvacCert:         'certification',
  certNoExpiry:     'certNo',
  vehicleRegNo:     'vehicleReg',
  drivingLicenceNo: 'licenceNo',
  aadhaarNumber:    'aadhaar',
  panNumber:        'pan',
};

const NUMERIC = new Set(['salary', 'advance', 'jobsTarget', 'dailyAllowance', 'overtimeRate', 'experience']);

const pick = (obj, keys) =>
  keys.reduce((acc, k) => (obj[k] !== undefined && obj[k] !== '' ? { ...acc, [k]: obj[k] } : acc), {});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const cleanEmail = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');

router.post('/', async (req, res) => {
  const body = req.body || {};
  const wantLogin     = body.loginAllowed === true;
  const emailNotif    = body.emailNotif !== false;      // default on
  const whatsappNotif = body.whatsappNotif === true;    // default off
  const tempPassword  = typeof body.tempPassword === 'string' ? body.tempPassword : '';
  // userRole is only a display label (Technician (Field) / Senior Technician / Supervisor).
  // The account role is always "technician" so the technician portal keeps working.
  const roleLabel = typeof body.userRole === 'string' && body.userRole.trim() ? body.userRole.trim() : 'Technician (Field)';

  // Modal field names → Technician schema names
  const data = pick(body, DIRECT_FIELDS);
  for (const [from, to] of Object.entries(RENAMED_FIELDS)) {
    if (body[from] !== undefined && body[from] !== '') data[to] = body[from];   // service area wins over address "area"
  }
  if (body.emergencyContact?.name)  data.emergencyName  = body.emergencyContact.name;
  if (body.emergencyContact?.phone) data.emergencyPhone = body.emergencyContact.phone;
  const bank = body.bankDetails || {};
  if (bank.accountHolder) data.accountHolder = bank.accountHolder;
  if (bank.bank)          data.bankName      = bank.bank;
  if (bank.accountNumber) { data.accountNo = bank.accountNumber; data.bankAccount = bank.accountNumber; }
  if (bank.ifsc)          data.ifsc          = bank.ifsc;
  if (bank.accountType)   data.accountType   = bank.accountType;
  if (bank.upiId)         data.upiId         = bank.upiId;
  if (typeof data.area === 'string') data.area = data.area.trim();
  for (const k of NUMERIC) if (data[k] !== undefined) data[k] = Number(data[k]) || 0;

  // Photo: only accept a URL produced by our own /api/upload
  const photo = typeof body.photo === 'string' && /^\/uploads\/[\w./-]+$/.test(body.photo) ? body.photo : '';
  if (photo) data.photo = photo;

  const loginEmail = cleanEmail(body.email) || cleanEmail(body.personalEmail);
  if (cleanEmail(body.email)) data.email = cleanEmail(body.email);
  else delete data.email;

  try {
    // ── Pre-checks (nothing is written until these pass) ─────────────────────
    if (wantLogin) {
      if (!['admin', 'manager'].includes(req.user?.role))
        return res.status(403).json({ message: 'Only an admin or manager can grant app access.' });
      if (!loginEmail || !EMAIL_RE.test(loginEmail))
        return res.status(400).json({ message: 'A valid email (or personal email) is required to grant app access.' });
      if (tempPassword.length < 8)
        return res.status(400).json({ message: 'Temporary password must be at least 8 characters.' });
      if (await User.findOne({ email: loginEmail }).select('_id'))
        return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    // ── 1. Technician ────────────────────────────────────────────────────────
    const tech = await Technician.create({
      ...data,
      emailNotifications:    emailNotif,
      whatsappNotifications: whatsappNotif,
    });

    const access = { created: false, emailSent: false, whatsappSent: false, note: '' };

    // ── 2. App login (User) ──────────────────────────────────────────────────
    if (wantLogin) {
      let user;
      try {
        user = await User.create({
          name:               tech.name,
          email:              loginEmail,
          password:           tempPassword,          // hashed by User pre-save hook
          role:               'technician',
          technician:         tech._id,
          phone:              tech.phone,
          avatar:             photo || undefined,
          isActive:           true,
          mustChangePassword: true,
          // Shown in the Users table:
          empId:              tech.techId,           // e.g. T05 instead of EMP-###
          department:         body.department || 'Field Service',
          roleLevel:          roleLabel,
          location:           tech.area || '',
          permissions:        ['Technician App Access'],
          notifications:      { emailDigest: emailNotif, smsAlerts: whatsappNotif },
        });
      } catch (err) {
        // Don't leave a half-created technician behind
        await Technician.findByIdAndDelete(tech._id);
        const dup = err?.code === 11000;
        return res.status(dup ? 409 : 400).json({
          message: dup ? 'A user with this email or ID already exists.' : err.message,
        });
      }

      tech.user         = user._id;
      tech.portalAccess = true;
      await tech.save();
      access.created = true;

      // ── 3. Send credentials ────────────────────────────────────────────────
      const notes = [];

      if (emailNotif) {
        try {
          await sendTechnicianWelcomeEmail({
            to: loginEmail,
            name: tech.name,
            techId: tech.techId,
            email: loginEmail,
            tempPassword,
          });
          access.emailSent = true;
        } catch (err) {
          console.error('[technician-access] welcome email failed:', err.message);
          notes.push('email could not be sent — share the password manually');
        }
      } else {
        notes.push('email notifications are off — share the password manually');
      }

      if (whatsappNotif) {
        try {
          await sendTechnicianWelcomeWhatsApp({
            phone: tech.phone,
            name: tech.name,
            email: loginEmail,
            tempPassword,
          });
          access.whatsappSent = true;
        } catch (err) {
          console.error('[technician-access] welcome WhatsApp failed:', err.message);
          notes.push('WhatsApp message could not be sent');
        }
      }

      access.note = notes.join('; ');
    }

    return res.status(201).json({ ...tech.toJSON(), access });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

export default router;