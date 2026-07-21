import SalesOrder from '../models/SalesOrder.js';

const isObjectId = (v) => /^[0-9a-fA-F]{24}$/.test(v);
const idQuery = (id) => (isObjectId(id) ? { _id: id } : { soId: id });

// GET /api/sales-orders
export const listSalesOrders = async (req, res) => {
  try {
    const { limit = 200, page = 1, status, payStatus, q } = req.query;
    const filter = { deletedAt: null };
    if (status) filter.status = status;
    if (payStatus) filter.payStatus = payStatus;
    if (q) {
      filter.$or = [
        { soId: { $regex: q, $options: 'i' } },
        { customer: { $regex: q, $options: 'i' } },
      ];
    }
    const docs = await SalesOrder.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));
    res.json({ data: docs });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/sales-orders/:id
export const getSalesOrder = async (req, res) => {
  try {
    const doc = await SalesOrder.findOne(idQuery(req.params.id));
    if (!doc) return res.status(404).json({ message: 'Sales order not found' });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/sales-orders
export const createSalesOrder = async (req, res) => {
  try {
    const doc = await SalesOrder.create(req.body);
    res.status(201).json({ data: doc });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/sales-orders/:id
export const updateSalesOrder = async (req, res) => {
  try {
    const doc = await SalesOrder.findOneAndUpdate(idQuery(req.params.id), req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: 'Sales order not found' });
    res.json({ data: doc });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/sales-orders/:id  (soft delete)
export const deleteSalesOrder = async (req, res) => {
  try {
    const doc = await SalesOrder.findOneAndUpdate(
      idQuery(req.params.id),
      { deletedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Sales order not found' });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/sales-orders/:id/restore
export const restoreSalesOrder = async (req, res) => {
  try {
    const doc = await SalesOrder.findOneAndUpdate(
      idQuery(req.params.id),
      { deletedAt: null },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: 'Sales order not found' });
    res.json({ data: doc });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};