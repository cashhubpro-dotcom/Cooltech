import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Attaches a `/tickets` namespace to the `io` instance your server.js
 * already creates (for WhatsApp) — does NOT create a second Socket.io
 * server, which Socket.io doesn't support per HTTP server.
 *
 * Your JWT payload only carries `{ id }` (see middleware/auth.js's
 * `protect` — it looks up the User by id on every request rather than
 * trusting role/customer from the token). This does the same lookup once
 * at connection time, so `role` and `customer` here can't go stale if an
 * admin changes someone's role mid-session — the socket would just need
 * to reconnect.
 *
 * Call from server.js, right after `initWhatsApp(io)`:
 *   import { initTicketSocket } from './sockets/ticketSocket.js';
 *   initTicketSocket(io);
 */
let ticketNamespace = null;

export function initTicketSocket(io) {
  ticketNamespace = io.of('/tickets');

  ticketNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('role customer');
      if (!user) return next(new Error('User no longer exists'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Unauthorized socket connection'));
    }
  });

  ticketNamespace.on('connection', (socket) => {
    const { role, customer } = socket.user;

    if (role === 'client' && customer) {
      socket.join(`customer:${customer}`);
    }
    if (['admin', 'manager', 'viewer'].includes(role)) {
      socket.join('admin');
    }
  });

  return ticketNamespace;
}

/** Called after a client creates a ticket — notifies admin dashboards live. */
export function emitNewTicketToAdmins(ticket) {
  ticketNamespace?.to('admin').emit('ticket:new', { ticketId: ticket.ticketId, id: ticket._id });
}

/** Called after any update (new message, status change) — notifies the owning customer. */
export function emitTicketUpdate(ticket) {
  ticketNamespace?.to(`customer:${ticket.customer}`).emit('ticket:update', { id: ticket._id, ticketId: ticket.ticketId });
  ticketNamespace?.to('admin').emit('ticket:update', { id: ticket._id, ticketId: ticket.ticketId });
}