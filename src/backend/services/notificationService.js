// services/notificationService.js
/**
 * Email-only notification service using Nodemailer.
 *
 * .env variables required:
 *   EMAIL_HOST       e.g. smtp.gmail.com
 *   EMAIL_PORT       e.g. 587
 *   EMAIL_SECURE     true | false  (true = port 465, false = STARTTLS)
 *   EMAIL_USER       your Gmail / SMTP address
 *   EMAIL_PASS       Gmail App Password (not your regular password)
 *   EMAIL_FROM_NAME  e.g. CoolTech AC Services
 */

import nodemailer from 'nodemailer';

// ── Build transporter once (cached) ──────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error(
      'Email not configured. Set EMAIL_USER and EMAIL_PASS in your .env file.'
    );
  }

  _transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',   // false = STARTTLS (port 587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return _transporter;
}

// ── HTML email template ───────────────────────────────────────────────────────
function buildHtml(message, customerName = '') {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
</head>
<body style="margin:0;padding:0;background:#F5F6FA;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F6FA;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:14px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#EA580C,#C2410C);
                        padding:28px 36px;text-align:center;">
              <div style="font-size:26px;margin-bottom:6px;">❄️</div>
              <div style="color:#fff;font-size:20px;font-weight:700;
                           letter-spacing:.3px;">CoolTech AC Services</div>
              <div style="color:rgba(255,255,255,.75);font-size:12px;margin-top:4px;">
                Professional AC Solutions
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              ${customerName
                ? `<p style="margin:0 0 16px;font-size:15px;color:#1E293B;">
                     Dear <strong>${customerName}</strong>,
                   </p>`
                : ''}
              <p style="margin:0 0 20px;font-size:14px;line-height:1.8;color:#374151;
                          white-space:pre-wrap;">${message}</p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0 8px;">
                <a href="http://localhost:5173/marketing/reviews"
                   style="display:inline-block;padding:12px 32px;
                           background:linear-gradient(135deg,#EA580C,#C2410C);
                           color:#fff;font-size:14px;font-weight:700;
                           border-radius:8px;text-decoration:none;
                           box-shadow:0 3px 10px rgba(234,88,12,.4);">
                  ⭐ Leave a Review
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F9FAFB;padding:18px 36px;border-top:1px solid #E5E7EB;
                        text-align:center;">
              <p style="margin:0;font-size:11px;color:#94A3B8;line-height:1.6;">
                This email was sent by CoolTech AC Services.<br/>
                If you have any questions, reply to this email or call us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── sendEmail ─────────────────────────────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string}  opts.to            – recipient email address
 * @param {string}  opts.subject       – email subject line
 * @param {string}  opts.message       – plain-text body (also used inside HTML template)
 * @param {string} [opts.customerName] – used for "Dear <name>" greeting
 * @returns {{ messageId: string }}
 */
export async function sendEmail({ to, subject, message, customerName }) {
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from:    `"${process.env.EMAIL_FROM_NAME || 'CoolTech AC Services'}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text:    message,                                // plain-text fallback
    html:    buildHtml(message, customerName),       // rich HTML version
  });

  return { messageId: info.messageId };
}

// ── dispatch (kept for compatibility with reviews.routes.js) ──────────────────
/**
 * @param {'Email'} channel   – only 'Email' is supported
 * @param {string}  recipient – email address
 * @param {string}  message   – body text
 * @param {string}  [subject] – defaults to review request subject
 * @param {string}  [customerName]
 */
export async function dispatch(
  channel,
  recipient,
  message,
  subject      = "We'd love your feedback — CoolTech AC Services",
  customerName = ''
) {
  if (channel !== 'Email') {
    throw new Error(`Only Email is supported. Received: "${channel}"`);
  }
  return sendEmail({ to: recipient, subject, message, customerName });
}