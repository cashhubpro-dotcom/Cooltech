import AMC, { AMC_CHECKLIST_TEMPLATE } from '../models/AMC.js';

const CUSTOMER_FIELDS = 'name phone email address area city state pincode';

// ── Helpers ────────────────────────────────────────────────────────────────
function computePriority(amc) {
  if (amc.done >= amc.visits) return 'completed';
  if (!amc.nextVisit) return 'upcoming';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const nv = new Date(amc.nextVisit); nv.setHours(0, 0, 0, 0);
  return nv.getTime() <= today.getTime() ? 'today' : 'upcoming';
}

// Shapes an AMC doc the way the technician frontend consumes it — flattens
// the customer info a technician actually needs (address/phone, not billing
// fields), and surfaces the currently-open visit's checklist/report inline
// so the frontend doesn't need a second request to render the detail view.
function toTechnicianView(amc) {
  const currentVisit = amc.visitLog.find((v) => v.status === 'pending') || null;
  return {
    _id: amc._id,
    id: amc.amcId,
    customer: amc.customer?.name || amc.customerName || '',
    address: [amc.customer?.address, amc.customer?.area, amc.customer?.city].filter(Boolean).join(', '),
    phone: amc.customer?.phone || '',
    plan: amc.plan,
    status: amc.status,
    units: amc.units,
    done: amc.done,
    total: amc.visits,
    nextVisit: amc.nextVisit,
    notes: amc.notes || '',
    priority: computePriority(amc),
    acDetails: amc.acDetails,
    currentVisitNumber: currentVisit?.visitNumber || null,
    checklist: currentVisit?.checklist || AMC_CHECKLIST_TEMPLATE.map((label) => ({ label, checked: false })),
    reportText: currentVisit?.reportText || '',
  };
}

// Fetches a contract and enforces ownership in one place — every technician
// route goes through this so "not mine" and "doesn't exist" both come back
// as a 404 rather than leaking which AMC IDs exist.
async function findOwnedContract(req, res) {
  const amc = await AMC.findOne({
    _id: req.params.id,
    assignedTechnician: req.user._id,
    isDeleted: { $ne: true },
  }).populate('customer', CUSTOMER_FIELDS);

  if (!amc) {
    res.status(404).json({ message: 'AMC contract not found or not assigned to you.' });
    return null;
  }
  return amc;
}

// ── GET /api/technician/amc ───────────────────────────────────────────────
export const listMyAmc = async (req, res) => {
  try {
    const contracts = await AMC.find({
      assignedTechnician: req.user._id,
      isDeleted: { $ne: true },
    })
      .populate('customer', CUSTOMER_FIELDS)
      .sort({ nextVisit: 1 });

    res.json({ data: contracts.map(toTechnicianView) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/technician/amc/summary ───────────────────────────────────────
export const summary = async (req, res) => {
  try {
    const contracts = await AMC.find({
      assignedTechnician: req.user._id,
      isDeleted: { $ne: true },
    });

    const priorities = contracts.map(computePriority);
    res.json({
      dueTodayCount: priorities.filter((p) => p === 'today').length,
      upcomingCount: priorities.filter((p) => p === 'upcoming').length,
      totalUnits:    contracts.reduce((s, c) => s + c.units, 0),
      visitsDone:    contracts.reduce((s, c) => s + c.done, 0),
      visitsAll:     contracts.reduce((s, c) => s + c.visits, 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/technician/amc/:id ───────────────────────────────────────────
export const getMyAmcById = async (req, res) => {
  try {
    const amc = await findOwnedContract(req, res);
    if (!amc) return;

    amc.ensureVisitLog();
    if (amc.isModified()) await amc.save();

    res.json({ data: toTechnicianView(amc) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/technician/amc/:id/checklist ───────────────────────────────
// body: { itemIndex: number, checked: boolean }
export const updateChecklist = async (req, res) => {
  try {
    const { itemIndex, checked } = req.body;
    if (typeof itemIndex !== 'number')
      return res.status(400).json({ message: 'itemIndex is required.' });

    const amc = await findOwnedContract(req, res);
    if (!amc) return;
    amc.ensureVisitLog();

    const currentVisit = amc.visitLog.find((v) => v.status === 'pending');
    if (!currentVisit)
      return res.status(400).json({ message: 'All scheduled visits for this contract are already completed.' });
    if (!currentVisit.checklist[itemIndex])
      return res.status(400).json({ message: 'Invalid checklist item.' });

    currentVisit.checklist[itemIndex].checked = !!checked;
    await amc.save();

    res.json({ data: toTechnicianView(amc) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /api/technician/amc/:id/complete-visit ──────────────────────────
// body: { reportText?: string }  — used by both "Submit Visit Report" (with
// text) and the sidebar "Mark Visit Complete" quick action (without text).
export const completeVisit = async (req, res) => {
  try {
    const amc = await findOwnedContract(req, res);
    if (!amc) return;
    amc.ensureVisitLog();

    const currentVisit = amc.visitLog.find((v) => v.status === 'pending');
    if (!currentVisit)
      return res.status(400).json({ message: 'All scheduled visits for this contract are already completed.' });

    currentVisit.status = 'completed';
    currentVisit.completedDate = new Date();
    currentVisit.completedBy = req.user._id;
    if (typeof req.body.reportText === 'string') currentVisit.reportText = req.body.reportText;

    amc.done = Math.min(amc.visits, amc.done + 1);

    await amc.save();

    if (typeof req.user.logActivity === 'function') {
      await req.user.logActivity(`Completed AMC visit for ${amc.amcId}`, '#22C55E');
    }

    res.json({ data: toTechnicianView(amc) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};