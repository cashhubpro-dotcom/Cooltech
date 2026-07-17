import PriceItem, { VALID_CATEGORIES, VALID_UNITS, VALID_GST } from "../models/PriceItem.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/services/stats
export const getStats = asyncHandler(async (req, res) => {
  const [totalItems, active, categoryAgg, avgAgg] = await Promise.all([
    PriceItem.countDocuments(),
    PriceItem.countDocuments({ status: "Active" }),
    PriceItem.distinct("category"),
    PriceItem.aggregate([
      { $match: { status: "Active" } },
      { $group: { _id: null, avgPrice: { $avg: "$price" } } },
    ]),
  ]);
  res.json({
    success: true,
    data: {
      totalItems, active,
      categories: categoryAgg.length,
      avgPrice: avgAgg[0] ? Math.round(avgAgg[0].avgPrice) : 0,
    },
  });
});

// GET /api/services/meta/options
export const getMetaOptions = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { categories: VALID_CATEGORIES, units: VALID_UNITS, gstOptions: VALID_GST },
  });
});

// GET /api/services
export const getAllPriceItems = asyncHandler(async (req, res) => {
  const { search = "", category = "", status = "", page = 1, limit = 20, sort = "priceId", order = "asc" } = req.query;
  const filter = {};
  if (search)   filter.name     = { $regex: search, $options: "i" };
  if (category) filter.category = category;
  if (status)   filter.status   = status;

  const skip    = (Number(page) - 1) * Number(limit);
  const sortDir = order === "desc" ? -1 : 1;

  const [items, total] = await Promise.all([
    PriceItem.find(filter).sort({ [sort]: sortDir }).skip(skip).limit(Number(limit)),
    PriceItem.countDocuments(filter),
  ]);
  res.json({ success: true, count: items.length, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), data: items });
});

// GET /api/services/:id
export const getPriceItemById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await PriceItem.findOne({
    $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { priceId: id }],
  });
  if (!item) { res.status(404); throw new Error(`Price item "${id}" not found`); }
  res.json({ success: true, data: item });
});

// POST /api/services
export const createPriceItem = asyncHandler(async (req, res) => {
  // ✅ Destructure ONLY the fields we need — never let _id or id through
  const { name, category, unit, price, gstPercent, status } = req.body;

  if (!name)  { res.status(400); throw new Error("name is required"); }
  if (!price) { res.status(400); throw new Error("price is required"); }

  const item = await PriceItem.create({
    name,
    category:   category   || "Service",
    unit:       unit       || "per visit",
    price:      Number(price),
    gstPercent: Number(gstPercent ?? 18),
    status:     status     || "Active",
    // _id is intentionally omitted — MongoDB generates it fresh
  });

  res.status(201).json({ success: true, message: "Price item created successfully", data: item });
});

// PUT /api/services/:id
export const updatePriceItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, category, unit, price, gstPercent, status } = req.body;

  const item = await PriceItem.findOne({
    $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { priceId: id }],
  });
  if (!item) { res.status(404); throw new Error(`Price item "${id}" not found`); }

  if (name       !== undefined) item.name       = name;
  if (category   !== undefined) item.category   = category;
  if (unit       !== undefined) item.unit       = unit;
  if (price      !== undefined) item.price      = Number(price);
  if (gstPercent !== undefined) item.gstPercent = Number(gstPercent);
  if (status     !== undefined) item.status     = status;

  await item.save();
  res.json({ success: true, message: "Price item updated successfully", data: item });
});

// DELETE /api/services/:id
export const deletePriceItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await PriceItem.findOneAndDelete({
    $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { priceId: id }],
  });
  if (!item) { res.status(404); throw new Error(`Price item "${id}" not found`); }
  res.json({ success: true, message: `"${item.priceId} - ${item.name}" deleted`, data: { priceId: item.priceId } });
});

// PATCH /api/services/:id/toggle-status
export const toggleStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await PriceItem.findOne({
    $or: [{ _id: id.match(/^[a-f\d]{24}$/i) ? id : null }, { priceId: id }],
  });
  if (!item) { res.status(404); throw new Error(`Price item "${id}" not found`); }
  item.status = item.status === "Active" ? "Inactive" : "Active";
  await item.save();
  res.json({ success: true, message: `Status changed to ${item.status}`, data: { priceId: item.priceId, status: item.status } });
});