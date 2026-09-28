// utils/clientAccessMail.js
// Sends new customers / technicians their app-login details (email + optional WhatsApp).
import nodemailer from 'nodemailer';

const esc = (v = '') =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const transporter = () =>
  nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    tls: { rejectUnauthorized: false },
  });

export const portalLoginUrl = () =>
  `${(process.env.CLIENT_URL || '').replace(/\/$/, '')}/login`;

// ── Shared building blocks ────────────────────────────────────────────────────
async function sendCredentialsEmail({ to, subject, name, intro, idLabel, idValue, email, tempPassword }) {
  const loginUrl = portalLoginUrl();

  await transporter().sendMail({
    from: `"CoolTech AC" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject,
    html: `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#1e293b">
  <div style="background:#EA580C;color:#fff;padding:18px 24px;border-radius:10px 10px 0 0">
    <h2 style="margin:0;font-size:18px">❄️ CoolTech AC Services</h2>
  </div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 10px 10px">
    <p style="margin:0 0 12px;font-size:15px">Hi <b>${esc(name)}</b>,</p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.6">${esc(intro)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 18px">
      <tr><td style="padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;width:38%"><b>${esc(idLabel)}</b></td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0">${esc(idValue)}</td></tr>
      <tr><td style="padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0"><b>Login email</b></td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0">${esc(email)}</td></tr>
      <tr><td style="padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0"><b>Temporary password</b></td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-family:Consolas,monospace;font-size:15px">${esc(tempPassword)}</td></tr>
    </table>
    <a href="${esc(loginUrl)}" style="display:inline-block;padding:11px 22px;background:#EA580C;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Log in</a>
    <p style="margin:18px 0 0;font-size:12.5px;color:#64748b;line-height:1.6">
      For your security, please change this temporary password after your first login.
      If you weren't expecting this email, you can ignore it.
    </p>
  </div>
</div>`,
  });
}

async function sendCredentialsWhatsApp({ phone, name, email, tempPassword, headline }) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 10) throw new Error('Invalid phone number');
  const chatId = `${digits.length === 10 ? '91' + digits : digits}@c.us`;

  const { sendMessage } = await import('../services/whatsappService.js');
  await sendMessage(
    chatId,
    `Hi ${name}, ${headline} ❄️\n\n` +
    `Login: ${portalLoginUrl()}\n` +
    `Email: ${email}\n` +
    `Temporary password: ${tempPassword}\n\n` +
    `Please change your password after your first login.`
  );
}

// ── Customers (client portal) ─────────────────────────────────────────────────
export const sendClientWelcomeEmail = ({ to, name, customerId, email, tempPassword }) =>
  sendCredentialsEmail({
    to, name, email, tempPassword,
    subject: 'Welcome to CoolTech AC — your client portal login',
    intro: 'Your client portal account is ready. You can use it to track your service jobs, invoices, AMC contracts and more.',
    idLabel: 'Customer ID',
    idValue: customerId,
  });

export const sendClientWelcomeWhatsApp = ({ phone, name, email, tempPassword }) =>
  sendCredentialsWhatsApp({
    phone, name, email, tempPassword,
    headline: 'welcome to CoolTech AC Services! Your client portal is ready:',
  });

// ── Technicians (technician app) ──────────────────────────────────────────────
export const sendTechnicianWelcomeEmail = ({ to, name, techId, email, tempPassword }) =>
  sendCredentialsEmail({
    to, name, email, tempPassword,
    subject: 'Welcome to CoolTech AC — your technician app login',
    intro: 'Your technician account is ready. Log in to see your assigned jobs, mark attendance, apply for leave and submit expenses.',
    idLabel: 'Technician ID',
    idValue: techId,
  });

export const sendTechnicianWelcomeWhatsApp = ({ phone, name, email, tempPassword }) =>
  sendCredentialsWhatsApp({
    phone, name, email, tempPassword,
    headline: 'welcome to the CoolTech AC team! Your technician app login is ready:',
  });