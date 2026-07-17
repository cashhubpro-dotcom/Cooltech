import express from 'express';
import { list, getOne, create, update, remove } from '../controllers/partWarrantyController.js';

const router = express.Router();

// If your other routes are auth-gated, add the same middleware here, e.g.:
// import { protect } from '../middleware/auth.js';
// router.use(protect);

router.get('/',     list);
router.get('/:id',  getOne);
router.post('/',    create);
router.put('/:id',  update);
router.delete('/:id', remove);

export default router;

// ─────────────────────────────────────────────────────────────────────────────
// Mount this in your main server file (wherever you do
// `app.use('/api/warranties', ...)`), e.g.:
//
//   import partWarrantyRoutes from './routes/partWarrantyRoutes.js';
//   app.use('/api/part-warranties', partWarrantyRoutes);
// ─────────────────────────────────────────────────────────────────────────────