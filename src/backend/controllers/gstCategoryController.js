// controllers/gstCategoryController.js
import GstCategory from '../models/GstCategory.js';
import GstHistory from '../models/GstHistory.js';

// GET /api/gst/categories
// Supports ?status=active to filter, defaults to returning all
export const getCategories = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const categories = await GstCategory.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
  }
};

// GET /api/gst/categories/:id
export const getCategoryById = async (req, res) => {
  try {
    const category = await GstCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch category', error: err.message });
  }
};

// POST /api/gst/categories
export const createCategory = async (req, res) => {
  try {
    const { name, subtitle, hsn, rate, supplyType, effectiveFrom, notification } = req.body;

    if (!name || rate === undefined || rate === null) {
      return res.status(400).json({ success: false, message: 'name and rate are required' });
    }

    const category = await GstCategory.create({
      name,
      subtitle,
      hsn,
      rate,
      supplyType,
      effectiveFrom: effectiveFrom || Date.now(),
      notification,
      status: 'active',
    });

    // Log creation as a history entry with oldRate = null,
    // matching the "+ new" treatment used in the UI
    await GstHistory.create({
      category: category._id,
      categoryName: category.name,
      oldRate: null,
      newRate: category.rate,
      effectiveFrom: category.effectiveFrom,
      notification: category.notification,
      changedBy: req.user?._id ?? null,
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create category', error: err.message });
  }
};

// PATCH /api/gst/categories/:id
// This is the "government changed the rate" endpoint. Only writes a
// history entry when the rate actually changes.
export const updateCategory = async (req, res) => {
  try {
    const existing = await GstCategory.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, subtitle, hsn, rate, supplyType, effectiveFrom, notification, status } = req.body;
    const oldRate = existing.rate;

    if (name !== undefined) existing.name = name;
    if (subtitle !== undefined) existing.subtitle = subtitle;
    if (hsn !== undefined) existing.hsn = hsn;
    if (rate !== undefined) existing.rate = rate;
    if (supplyType !== undefined) existing.supplyType = supplyType;
    if (effectiveFrom !== undefined) existing.effectiveFrom = effectiveFrom;
    if (notification !== undefined) existing.notification = notification;
    if (status !== undefined) existing.status = status;

    await existing.save();

    if (rate !== undefined && Number(rate) !== oldRate) {
      await GstHistory.create({
        category: existing._id,
        categoryName: existing.name,
        oldRate,
        newRate: existing.rate,
        effectiveFrom: existing.effectiveFrom,
        notification: existing.notification,
        changedBy: req.user?._id ?? null,
      });
    }

    res.json({ success: true, data: existing });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update category', error: err.message });
  }
};

// DELETE /api/gst/categories/:id
// Soft delete — keeps history and past invoices referencing this category intact
export const deactivateCategory = async (req, res) => {
  try {
    const category = await GstCategory.findByIdAndUpdate(
      req.params.id,
      { status: 'inactive' },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to deactivate category', error: err.message });
  }
};