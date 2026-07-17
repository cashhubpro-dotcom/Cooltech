/**
 * createCRUD(Model, options)
 * Generates standard Express CRUD routes for any Mongoose model.
 *
 * GET    /            – paginated list with search/filter
 * GET    /deleted     – soft-deleted items  (softDelete only)
 * GET    /:id         – single document
 * POST   /            – create
 * PUT    /:id         – full/partial update
 * PUT    /:id/restore – restore soft-deleted item  (softDelete only)
 * DELETE /:id         – soft or hard delete
 * DELETE /:id/hard    – permanent delete  (softDelete only)
 *
 * FIX: /deleted and /:id/restore were registered AFTER /:id, so Express was
 * treating the literal string "deleted" / "restore" as an :id value and the
 * real handlers were never reached.  All static segments must come BEFORE
 * parameterised routes.
 */

import express from 'express';

export function createCRUD(Model, options = {}) {
  const {
    searchFields = ['name'],
    filterFields = [],
    softDelete   = true,
    populate     = [],
    defaultSort  = { createdAt: -1 },
    beforeCreate,
    afterCreate,
    beforeUpdate,
  } = options;

  const router = express.Router();

  // ── LIST ───────────────────────────────────────────────────────────────────
  router.get('/', async (req, res) => {
    try {
      const { page = 1, limit = 50, search, sort, ...rest } = req.query;
      const query = softDelete ? { isDeleted: { $ne: true } } : {};

      if (search && searchFields.length) {
        query.$or = searchFields.map(f => ({
          [f]: { $regex: search, $options: 'i' },
        }));
      }

      for (const f of filterFields) {
        if (rest[f] !== undefined) query[f] = rest[f];
      }

      const sortObj = sort
        ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 }
        : defaultSort;

      let q = Model.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(Number(limit));

      for (const p of populate) q = q.populate(p);

      const [data, total] = await Promise.all([q, Model.countDocuments(query)]);
      res.json({ data, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── STATIC ROUTES — must come before /:id ─────────────────────────────────

  if (softDelete) {
    // GET /deleted
    router.get('/deleted', async (req, res) => {
      try {
        const data = await Model.find({ isDeleted: true }).sort(defaultSort);
        res.json({ data, total: data.length });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  router.post('/', async (req, res) => {
    try {
      let body = req.body;
      if (beforeCreate) body = await beforeCreate(body, req);
      const doc = await Model.create(body);
      if (afterCreate) await afterCreate(doc, req);
      res.status(201).json(doc);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });

  // ── PARAMETERISED ROUTES — all /:id handlers below this line ──────────────

  // GET /:id
  router.get('/:id', async (req, res) => {
    try {
      let q = Model.findById(req.params.id);
      for (const p of populate) q = q.populate(p);
      const doc = await q;
      if (!doc) return res.status(404).json({ message: 'Not found.' });
      res.json(doc);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  // PUT /:id/restore  — must be before PUT /:id so "restore" isn't swallowed
  if (softDelete) {
    router.put('/:id/restore', async (req, res) => {
      try {
        const doc = await Model.findByIdAndUpdate(
          req.params.id,
          { isDeleted: false, deletedAt: null },
          { new: true }
        );
        if (!doc) return res.status(404).json({ message: 'Not found.' });
        res.json({ message: 'Restored.', doc });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
  }

  // PUT /:id
  // router.put('/:id', async (req, res) => {
  //   try {
  //     let body = req.body;
  //     if (beforeUpdate) body = await beforeUpdate(body, req);
  //     const doc = await Model.findByIdAndUpdate(req.params.id, body, {
  //       new: true,
  //       runValidators: true,
  //     });
  //     if (!doc) return res.status(404).json({ message: 'Not found.' });
  //     res.json(doc);
  //   } catch (err) {
  //     res.status(400).json({ message: err.message });
  //   }
  // });

  // PUT /:id
router.put('/:id', async (req, res) => {
  try {
    let body = req.body;
    if (beforeUpdate) body = await beforeUpdate(body, req);
    let doc = await Model.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ message: 'Not found.' });
    for (const p of populate) doc = await doc.populate(p);
    res.json(doc);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

  // DELETE /:id/hard — must be before DELETE /:id
  if (softDelete) {
    router.delete('/:id/hard', async (req, res) => {
      try {
        const doc = await Model.findByIdAndDelete(req.params.id);
        if (!doc) return res.status(404).json({ message: 'Not found.' });
        res.json({ message: 'Permanently deleted.' });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
  }

  // DELETE /:id
  router.delete('/:id', async (req, res) => {
    try {
      if (softDelete) {
        const doc = await Model.findByIdAndUpdate(
          req.params.id,
          { isDeleted: true, deletedAt: new Date() },
          { new: true }
        );
        if (!doc) return res.status(404).json({ message: 'Not found.' });
        return res.json({ message: 'Moved to trash.', doc });
      }
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found.' });
      res.json({ message: 'Deleted permanently.' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

  return router;
}