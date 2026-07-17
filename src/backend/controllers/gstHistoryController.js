// controllers/gstHistoryController.js
import GstCategory from '../models/GstCategory.js';
import GstHistory from '../models/GstHistory.js';
import { calculateGst } from '../utils/gstCalculator.js';

// GET /api/gst/history
// Optional ?categoryId= to filter to one category's audit trail
export const getHistory = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.category = req.query.categoryId;

    const history = await GstHistory.find(filter)
      .sort({ changedOn: -1 })
      .limit(Number(req.query.limit) || 100);

    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history', error: err.message });
  }
};

// POST /api/gst/calculate
// body: { categoryId, baseAmount }
// Server-side source of truth for the live invoice preview so the
// frontend (and the real invoice module) never hardcodes CGST/SGST/IGST math.
export const calculate = async (req, res) => {
  try {
    const { categoryId, baseAmount } = req.body;
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'categoryId is required' });
    }

    const category = await GstCategory.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const result = calculateGst(baseAmount, category.rate, category.supplyType);
    res.json({
      success: true,
      data: {
        category: {
          id: category._id,
          name: category.name,
          hsn: category.hsn,
          rate: category.rate,
          supplyType: category.supplyType,
        },
        ...result,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to calculate GST', error: err.message });
  }
};