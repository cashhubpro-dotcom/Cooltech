/**
 * stripMongoId.middleware.js  — ES Module version
 *
 * Strips _id, __v, createdAt, updatedAt from every POST and PUT body
 * before it reaches your controller.
 *
 * Prevents E11000 duplicate key errors when the frontend accidentally
 * sends a MongoDB _id in a create body.
 *
 * Usage in server.js  (your backend uses "type":"module" so use import):
 *
 *   import stripMongoId from './middleware/stripMongoId.middleware.js';
 *   app.use(stripMongoId);
 */

const STRIP_KEYS = ['_id', '__v', 'createdAt', 'updatedAt', 'deletedAt'];

function deepStrip(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepStrip);

  const cleaned = {};
  for (const [k, v] of Object.entries(value)) {
    if (STRIP_KEYS.includes(k)) continue;
    cleaned[k] = deepStrip(v);
  }
  return cleaned;
}

// ← default export, ES Module style
export default function stripMongoId(req, res, next) {
  if ((req.method === 'POST' || req.method === 'PUT') && req.body) {
    req.body = deepStrip(req.body);
  }
  next();
}