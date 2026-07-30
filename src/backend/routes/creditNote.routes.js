import express from "express";
import CreditNote from "../models/CreditNote.model.js";

const router = express.Router();
const asyncWrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/credit-notes
router.get("/", asyncWrap(async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const filter = { isDeleted: { $ne: true } };

  if (search) {
    const rx = new RegExp(search, "i");
    filter.$or = [{ customer: rx }, { creditNoteId: rx }, { invoiceNo: rx }];
  }

  const skip  = (parseInt(page) - 1) * parseInt(limit);
  const total = await CreditNote.countDocuments(filter);
  const docs  = await CreditNote.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

  res.json({ success: true, total, page: parseInt(page), data: docs });
}));

// GET /api/credit-notes/:id
router.get("/:id", asyncWrap(async (req, res) => {
  const doc = await CreditNote.findById(req.params.id);
  if (!doc) return res.status(404).json({ success: false, message: "Credit note not found" });
  res.json({ success: true, data: doc });
}));

// DELETE /api/credit-notes/:id (soft delete)
router.delete("/:id", asyncWrap(async (req, res) => {
  const doc = await CreditNote.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  );
  if (!doc) return res.status(404).json({ success: false, message: "Credit note not found" });
  res.json({ success: true, message: "Credit note soft-deleted", data: doc });
}));

router.use((err, req, res, _next) => {
  console.error("[CreditNote Route Error]", err);
  res.status(500).json({ success: false, message: err.message || "Server error" });
});

export default router;