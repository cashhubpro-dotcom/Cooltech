import express from 'express';
import {
  getStats,
  getAllPriceItems,
  getPriceItemById,
  createPriceItem,
  updatePriceItem,
  deletePriceItem,
  toggleStatus,
  getMetaOptions,
} from '../controllers/priceItemController.js';

const router = express.Router();

// ── Meta & Stats ──────────────────────────────────────────
// GET /api/pricelist/stats         → Summary cards (total, active, categories, avg price)
router.get("/stats", getStats);

// GET /api/pricelist/meta/options  → Dropdown options for Add/Edit modal
router.get("/meta/options", getMetaOptions);

// ── Collection ────────────────────────────────────────────
// GET  /api/pricelist              → List all (with search, filter, pagination)
// POST /api/pricelist              → Create new price item
router.route("/").get(getAllPriceItems).post(createPriceItem);

// ── Single Item ───────────────────────────────────────────
// GET    /api/pricelist/:id        → Fetch by _id or PRC-XX
// PUT    /api/pricelist/:id        → Full update
// DELETE /api/pricelist/:id        → Hard delete
router
  .route("/:id")
  .get(getPriceItemById)
  .put(updatePriceItem)
  .delete(deletePriceItem);

// ── Actions ───────────────────────────────────────────────
// PATCH /api/pricelist/:id/toggle-status  → Toggle Active ↔ Inactive
router.patch("/:id/toggle-status", toggleStatus);

export default router;