// ─── routes/holidays.js ─────────────────────────────────────────────────────
import { Router } from 'express';
import { getHolidays } from '../services/holidaysService.js';

const router = Router();

// GET /api/holidays/:year  →  { success: true, data: { "YYYY-MM-DD": "Holiday Name", ... } }
router.get('/:year', async (req, res) => {
  const year = parseInt(req.params.year, 10);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return res.status(400).json({ success: false, message: 'Invalid year' });
  }

  const data = await getHolidays(year);
  res.json({ success: true, data });
});

export default router;