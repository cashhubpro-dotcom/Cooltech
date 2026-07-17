import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import 'dotenv/config';
import express from 'express';
import razorpayWebhook from './webhooks/razorpayWebhook.js';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import clientPaymentRoutes from './routes/clientPaymentRoutes.js';
import clientAmcRoutes from './routes/clientAmc.routes.js'; // moved up — mounted before apiRoutes below
import clientContractRoutes from './routes/clientContract.routes.js';
import technicianPortalRoutes from './routes/technicianPortal.routes.js';
import clientProfileRoutes from './routes/clientPortal/profile.routes.js';
import clientReportRoutes from './routes/clientreportRoutes.js';
import clientInvoiceRoutes from './routes/clientInvoiceRoutes.js';
import technicianAmcRoutes from './routes/technicianAmc.routes.js';
import technicianAttendanceRoutes from './routes/technicianAttendanceRoutes.js';
import technicianExpenseRoutes from './routes/technicianExpense.route.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import apiRoutes from './routes/api.js';
import stripMongoId from './middleware/stripMongoId.middleware.js';
import leaveRoutes from './routes/leaveRoutes.js';
import technicianLeaveRoutes from './routes/technicianLeaveRoutes.js';  
import timelogsRouter from './routes/timelogsRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import priceItemRoutes from './routes/priceItemRoutes.js';
import feedbackRouter from './routes/feedback.routes.js';
import profileRoutes from './routes/profile.routes.js';
import path from 'path';
import accountSettingsRoutes from './routes/accountSettings.routes.js';
import taskRoutes from './routes/taskRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import holidayRoutes from './routes/holidays.js';
import extendedRoutes from './routes/extendedRoutes.js';
import technicianLookupsRouter from './routes/technicianLookups.js';
import invoiceRoutes from "./routes/invoice.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import gstRoutes from './routes/gstRoutes.js';
import clientPortalRoutes from "./routes/clientPortal.routes.js";
import adCampaignRouter from './routes/adCampaign.routes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import smRoutes from "./routes/smRoutes.js";
import whatsappRoutes from './routes/whatsappRoutes.js';
import { initWhatsApp } from './services/whatsappService.js';
import partWarrantyRoutes from './routes/partWarrantyRoutes.js';
import payrollRoutes from './routes/payroll.js';
import payrollSettingsRoutes from './routes/payrollSettings.js';
import recruitmentRouter from './routes/recruitment.js';
import paymentRoutes from './routes/paymentRoutes.js';
import partRequestRoutes from './routes/partRequestRoutes.js';
import partRequestMineRoutes from './routes/partRequestMineRoutes.js';
import { protect } from './middleware/auth.js';
import { initTicketSocket } from './sockets/ticketSocket.js';
import announcementRoutes from './routes/announcementRoutes.js';
import dashboardOverviewRoutes from './routes/dashboardOverview.routes.js';

// ── Process-level safety net ──────────────────────────────────────────────
// Without these, ANY unhandled rejection anywhere (e.g. a Puppeteer crash
// during WhatsApp reconnect) kills the entire Node process and takes down
// every API route, not just WhatsApp.
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
});

connectDB();

const app = express();

// app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));

const allowedOrigins = [
  "http://localhost:5173",
  "https://cooltech-jexz.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile apps / postman
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
// raw body required for signature verification — before the json parser
app.post('/api/webhooks/razorpay', express.raw({ type: '*/*' }), razorpayWebhook);
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));
// Must run AFTER express.json()/urlencoded() so req.body is actually populated
// by the time it tries to strip _id/__v/createdAt/updatedAt from it.
app.use(stripMongoId);

app.get('/', (req, res) => res.json({ message: '❄️ CoolTech AC Backend API v1.0' }));

app.use('/api/auth', authRoutes);

// IMPORTANT: this must be registered BEFORE `app.use('/api', apiRoutes)`.
// Express matches app.use() calls in registration order, not by path
// specificity — '/api' is a prefix of '/api/client-portal/me/amc' too, so if
// apiRoutes were mounted first it (or an admin guard inside it) would
// intercept this request before Express ever tried this more specific path.
app.use('/api/client-portal/me/payments', clientPaymentRoutes);
app.use('/api/client-portal/me/amc', clientAmcRoutes);
app.use('/api/client-portal/me/contracts', clientContractRoutes);
app.use('/api/client-portal/me/profile', clientProfileRoutes);
app.use('/api/client-portal/me/invoices', clientInvoiceRoutes);
app.use('/api/client-portal/me/reports', clientReportRoutes);

app.use('/api/technician-portal/me', technicianPortalRoutes);
app.use('/api/technician/amc', technicianAmcRoutes);
app.use('/api/technician/attendance', technicianAttendanceRoutes);
app.use('/api/technician/leaves', technicianLeaveRoutes);
app.use('/api/technician/expenses', technicianExpenseRoutes); 

app.use('/api/attendance', attendanceRoutes);
app.use('/api', apiRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/timelogs', timelogsRouter);
app.use('/api/chat', chatRoutes);
app.use('/api/pricelist', priceItemRoutes);
// app.use('/api/services', priceItemRoutes);
app.use('/api/feedback', feedbackRouter);
app.use('/api/profile', profileRoutes);
app.use('/api/account', accountSettingsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/technician-lookups', technicianLookupsRouter);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/gst", gstRoutes);
app.use("/api/client-portal", clientPortalRoutes);
app.use("/api/sm", smRoutes);
app.use('/api/ad-campaigns', adCampaignRouter);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/dashboard', dashboardOverviewRoutes);


// ── Extended / Missing Modules ────────────────────────────────────────────────
app.use('/api', extendedRoutes);
app.use('/api', uploadRoutes);
app.use('/api/part-warranties', partWarrantyRoutes);
app.use('/api/payments', paymentRoutes);

// ── Parts Requests (technician → warehouse → admin approval) ─────────────────
// /mine MUST be mounted before the main CRUD router — same reasoning as the
// client-portal block above: it's a literal single-segment path that would
// otherwise be swallowed by the main router's GET /:id.
app.use('/api/part-requests/mine', protect, partRequestMineRoutes);
app.use('/api/part-requests', protect, partRequestRoutes);

app.use('/api/payroll', payrollRoutes);
app.use('/api/payroll-settings', payrollSettingsRoutes);
app.use('/api/recruitment', recruitmentRouter);

// Serve public folder (avatars accessible at /uploads/avatars/filename.jpg)
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initWhatsApp(io); // boots the WhatsApp Web session — watch the terminal for the QR code
initTicketSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} (with WhatsApp + Socket.IO)`));