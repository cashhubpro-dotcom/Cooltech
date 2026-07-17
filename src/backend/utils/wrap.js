// Was previously a local `const wrap = (fn) => ...` inside
// routes/technicianPortal.routes.js. Promoted here so every technician-portal
// route file (jobs, attendance, whatever comes next) shares one definition
// instead of each pasting its own copy.
//
// If you'd rather keep it local to each file, that's a one-line revert — but
// once there's a second file needing the exact same three lines, it's worth
// having one source of truth.
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);