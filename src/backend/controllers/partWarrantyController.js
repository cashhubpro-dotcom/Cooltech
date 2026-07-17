import PartWarranty from '../models/PartWarranty.js';

// ─────────────────────────────────────────────────────────────────────────────
// If your project's `createCRUD` helper (used for Task, Warranty, etc.) can
// take a Mongoose model and populate config directly, you can likely replace
// this whole file with something like:
//
//   import createCRUD from '../utils/createCRUD.js';
//   export const { list, getOne, create, update, remove } =
//     createCRUD(PartWarranty, { populate: ['customer', 'linkedUnit'], softDelete: true });
//
// This version is written out long-hand so it works standalone without
// needing to see that helper's exact signature.
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/part-warranties
export const list = async (req, res) => {
  try {
    const { limit = 500, skip = 0, status, partType, linkedUnit } = req.query;
    const filter = { isDeleted: { $ne: true } };
    if (status)     filter.status = status;
    if (partType)   filter.partType = partType;
    if (linkedUnit) filter.linkedUnit = linkedUnit;

    const data = await PartWarranty.find(filter)
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('customer', 'name')
      .populate('linkedUnit', 'warrantyId product customerName');

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/part-warranties/:id
export const getOne = async (req, res) => {
  try {
    const doc = await PartWarranty.findOne({ _id: req.params.id, isDeleted: { $ne: true } })
      .populate('customer', 'name')
      .populate('linkedUnit', 'warrantyId product customerName');
    if (!doc) return res.status(404).json({ success: false, message: 'Part warranty not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/part-warranties
export const create = async (req, res) => {
  try {
    const doc = await PartWarranty.create(req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/part-warranties/:id
export const update = async (req, res) => {
  try {
    const doc = await PartWarranty.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      req.body,
      { new: true, runValidators: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Part warranty not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/part-warranties/:id  (soft delete — matches your isDeleted convention)
export const remove = async (req, res) => {
  try {
    const doc = await PartWarranty.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!doc) return res.status(404).json({ success: false, message: 'Part warranty not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};