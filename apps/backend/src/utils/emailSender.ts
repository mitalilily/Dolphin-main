// utils/emailSender.ts
import dotenv from 'dotenv'
import fs from 'fs'
import nodemailer from 'nodemailer'
import path from 'path'

// Load correct .env based on NODE_ENV
const env = process.env.NODE_ENV || 'development'
dotenv.config({ path: path.resolve(__dirname, `../../.env.${env}`) })

const EMAIL_FROM = process.env.EMAIL_FROM || process.env.GOOGLE_SMTP_USER || ''
const GOOGLE_SMTP_USER = process.env.GOOGLE_SMTP_USER || EMAIL_FROM
const GOOGLE_SMTP_PASSWORD = process.env.GOOGLE_SMTP_PASSWORD || ''
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT || 587)
const SMTP_SECURE = process.env.SMTP_SECURE === 'true'

const maskEmailForLog = (email: string) => {
  const [localPart = '', domain = ''] = email.split('@')
  if (!localPart || !domain) return '[invalid-email]'

  const visibleLocal =
    localPart.length <= 2 ? `${localPart[0] ?? '*'}*` : `${localPart.slice(0, 2)}***`

  return `${visibleLocal}@${domain}`
}

type AttachmentInput = {
  /** local file path OR Buffer */
  path?: string
  buffer?: Buffer
  filename: string
  mimeType?: string
}

export const getEmailServiceConfigError = () => {
  if (!EMAIL_FROM || !GOOGLE_SMTP_USER) {
    return 'Email service is not configured. Missing EMAIL_FROM or GOOGLE_SMTP_USER.'
  }

  if (!GOOGLE_SMTP_PASSWORD) {
    return 'Email service is not configured. Missing GOOGLE_SMTP_PASSWORD.'
  }

  return null
}

export const isEmailServiceConfigured = () => getEmailServiceConfigError() === null

// Create SMTP transporter (Hostinger/custom SMTP if provided, else Gmail service)
const createTransporter = () => {
  const configError = getEmailServiceConfigError()
  if (configError) {
    throw new Error(configError)
  }

  console.log('[Email] Creating transporter', {
    provider: SMTP_HOST ? 'smtp' : 'gmail',
    host: SMTP_HOST || 'gmail',
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    from: EMAIL_FROM,
  })

  if (SMTP_HOST) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: GOOGLE_SMTP_USER,
        pass: GOOGLE_SMTP_PASSWORD,
      },
    })
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GOOGLE_SMTP_USER,
      pass: GOOGLE_SMTP_PASSWORD, // Use App Password for Gmail
    },
  })
}

/**
 * Low-level sendEmail supporting optional attachments
 */
const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string,
  attachments?: AttachmentInput[],
) => {
  const transporter = createTransporter()
  const maskedRecipient = maskEmailForLog(to)

  const mailOptions: any = {
    from: `"Dolphin Enterprise" <${EMAIL_FROM}>`,
    to,
    subject,
    html: htmlContent,
  }

  if (attachments && attachments.length) {
    mailOptions.attachments = await Promise.all(
      attachments.map(async (a) => {
        let buffer: Buffer
        if (a.buffer) buffer = a.buffer
        else if (a.path) buffer = fs.readFileSync(a.path)
        else throw new Error('Attachment must have path or buffer')

        return {
          filename: a.filename,
          content: buffer,
          contentType: a.mimeType,
        }
      }),
    )
  }

  try {
    console.log('[Email] Sending email', {
      to: maskedRecipient,
      subject,
      attachments: attachments?.length ?? 0,
    })
    const info = await transporter.sendMail(mailOptions)
    console.log('[Email] Email sent successfully', {
      to: maskedRecipient,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    })
  } catch (error) {
    console.error('[Email] Error sending email', {
      to: maskedRecipient,
      subject,
      error,
    })
    throw error
  }
}

// Login / verification Email for OTP-based auth
export const sendVerificationEmail = async (to: string, token: string) => {
  console.log('[Auth Email] Preparing verification email', {
    to: maskEmailForLog(to),
    tokenLength: token.length,
  })

  const html = `
    <div style="margin:0; padding:24px 12px; background:#f4f1ed;">
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
        max-width: 620px;
        margin: 0 auto;
        background: #fffdf9;
        border: 1px solid #eadfd4;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 18px 40px rgba(23,19,16,0.08);
        color: #171310;
      ">
        <div style="
          padding: 26px 28px 18px;
          background: linear-gradient(135deg, #171310 0%, #2a211d 100%);
          color: #ffffff;
        ">
          <div style="
            display:inline-block;
            padding:6px 12px;
            border-radius:999px;
            background:rgba(255,255,255,0.12);
            font-size:12px;
            font-weight:700;
            letter-spacing:0.08em;
            text-transform:uppercase;
          ">
            Dolphin Enterprise
          </div>

          <h1 style="margin:18px 0 8px; font-size:28px; line-height:1.2; font-weight:800;">
            Your sign-in code is ready
          </h1>

          <p style="margin:0; font-size:14px; line-height:1.7; color:rgba(255,255,255,0.82);">
            Use the verification code below to securely continue your login.
          </p>
        </div>

        <div style="padding:28px;">
          <div style="
            border:1px solid #eadfd4;
            border-radius:20px;
            background:linear-gradient(180deg, #fff 0%, #fbf5ef 100%);
            padding:22px;
            text-align:center;
          ">
            <p style="
              margin:0 0 10px;
              font-size:12px;
              font-weight:700;
              letter-spacing:0.12em;
              text-transform:uppercase;
              color:#8a6f5a;
            ">
              Verification Code
            </p>

            <div style="
              display:inline-block;
              padding:16px 24px;
              border-radius:16px;
              background:#171310;
              color:#ffffff;
              font-size:30px;
              line-height:1;
              font-weight:800;
              letter-spacing:8px;
            ">
              ${token}
            </div>

            <p style="margin:14px 0 0; font-size:13px; color:#6a5e59; line-height:1.6;">
              This code expires in <strong style="color:#171310;">6 minutes</strong>.
            </p>
          </div>

          <div style="
            margin-top:18px;
            padding:18px 20px;
            border-radius:18px;
            background:#f6efe7;
            border:1px solid #eadfd4;
          ">
            <p style="margin:0 0 8px; font-size:14px; font-weight:700; color:#171310;">
              Didn&apos;t request this?
            </p>
            <p style="margin:0; font-size:13px; line-height:1.7; color:#6a5e59;">
              You can safely ignore this email. Your account stays protected unless this code is entered.
            </p>
          </div>

          <div style="margin-top:22px; padding-top:18px; border-top:1px solid #eadfd4;">
            <p style="margin:0; font-size:12px; line-height:1.7; color:#8c7b70;">
              Sent by Dolphin Enterprise
            </p>
            <p style="margin:4px 0 0; font-size:12px; line-height:1.7; color:#a19185;">
              © ${new Date().getFullYear()} Dolphin Enterprise. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  `

  await sendEmail(to, 'Your Dolphin Enterprise verification code', html)
}

// Employee Credentials Email
export const sendEmployeeCredentials = async (
  to: string,
  email: string,
  password: string,
  createdBy: string, // name or email of the seller/admin
) => {
  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #fafafa;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1e293b; margin: 0;">Welcome to <span style="color:#2563eb;">Dolphin Enterprise</span> 🚀</h2>
        <p style="font-size: 15px; color: #64748b; margin-top: 8px;">Your employee account has been created successfully.</p>
      </div>

      <div style="background: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">
          An account has been created for you by <strong>${createdBy}</strong>.
        </p>
        <p style="font-size: 16px; color: #334155; margin: 0 0 12px 0;">Here are your login credentials:</p>
        <table style="width: 100%; font-size: 15px; color: #1e293b; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 40%;">Email</td>
            <td style="padding: 8px; background: #f9fafb; border-radius: 4px;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Password</td>
            <td style="padding: 8px; background: #f9fafb; border-radius: 4px;">${password}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #64748b; margin-top: 28px; text-align: center;">
        You can now log in to your Dolphin Enterprise account using these credentials.<br/>
        If you face any issues, please contact your administrator.
      </p>

      <div style="text-align: center; margin-top: 32px; font-size: 13px; color: #94a3b8;">
        — The Dolphin Enterprise Team
      </div>
    </div>
  `

  await sendEmail(to, 'Your Dolphin Enterprise Employee Account', html)
}
const escapeHtml = (unsafe: string) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const sendTempPasswordEmail = async (to: string, tempPassword: string) => {
  const safePassword = escapeHtml(tempPassword)

  const html = `
    <div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width:600px; margin:auto; padding:32px; border:1px solid #e5e7eb; border-radius:12px; background-color:#f9fafb;">
      <div style="text-align:center; margin-bottom:24px;">
        <h2 style="color:#1e293b; margin:0;">Dolphin Enterprise Account Password Reset</h2>
        <p style="font-size:15px; color:#64748b; margin-top:8px;">
          Your account password has been reset by our team.
        </p>
      </div>

      <div style="background:#fff; padding:20px; border-radius:8px; border:1px solid #e5e7eb; text-align:center;">
        <p style="font-size:16px; color:#334155; margin-bottom:16px;">
          Here is your temporary password:
        </p>
        <span style="display:inline-block; padding:12px 24px; font-size:20px; font-weight:bold; color:#ffffff; background-color:#2563eb; border-radius:6px; letter-spacing:1px;">
          ${safePassword}
        </span>
        <p style="font-size:14px; color:#64748b; margin-top:16px;">
          Use this password to log in and change it immediately.
        </p>
      </div>

      <p style="font-size:13px; color:#94a3b8; margin-top:28px; text-align:center;">
        If you did not request this, please contact our support immediately.<br/>
        — The Dolphin Enterprise Team
      </p>
    </div>
  `

  await sendEmail(to, 'Your Temporary Dolphin Enterprise Password', html)
}

export const sendInvoiceReadyEmail = async (opts: {
  to: string
  sellerName?: string
  invoiceNo: string
  periodStart: string // e.g. '01 Sep 2025'
  periodEnd: string
  totalAmount: string | number
  pdfUrl?: string // optional public url or local path
  csvUrl?: string // optional public url or local path
  attachFiles?: boolean // default false for production
  preferSignedUrls?: boolean // if true, treat pdfUrl/csvUrl as download links
}) => {
  const {
    to,
    sellerName,
    invoiceNo,
    periodStart,
    periodEnd,
    totalAmount,
    pdfUrl,
    csvUrl,
    attachFiles = false,
    preferSignedUrls = false,
  } = opts

  const safeSeller = sellerName ? sellerName : 'Seller'

  const html = `
  <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; padding:24px; color:#111">
    <h2 style="margin-bottom: 8px;">Your invoice is ready — ${invoiceNo}</h2>
    <p style="color:#555; margin-top:0;">Hello ${safeSeller},</p>
    <p style="color:#555">Your invoice for the period <strong>${periodStart}</strong> — <strong>${periodEnd}</strong> has been generated.</p>

    <table style="width:100%; margin-top:12px; border-collapse: collapse;">
      <tr>
        <td style="padding:8px; font-weight:600; width:40%;">Invoice No</td>
        <td style="padding:8px;">${invoiceNo}</td>
      </tr>
      <tr>
        <td style="padding:8px; font-weight:600;">Period</td>
        <td style="padding:8px;">${periodStart} — ${periodEnd}</td>
      </tr>
      <tr>
        <td style="padding:8px; font-weight:600;">Amount (GST inclusive)</td>
        <td style="padding:8px;">₹${Number(totalAmount).toFixed(2)}</td>
      </tr>
    </table>

    <div style="margin-top:16px;">
  ${
    preferSignedUrls && (pdfUrl || csvUrl)
      ? `<p style="margin-bottom:8px;">Download files:</p>
       ${pdfUrl ? `<p><a href="${pdfUrl}">Download PDF Invoice</a></p>` : ''}
       ${csvUrl ? `<p><a href="${csvUrl}">Download CSV breakdown</a></p>` : ''}`
      : `<p style="color:#555; margin-bottom:8px;">You can download the invoice files attached to this email.</p>`
  }
    </div>

    <p style="color:#777; margin-top:20px; font-size:13px;">
      If you have any questions or dispute an item on the invoice, please contact support or use the “raise dispute” option in your seller dashboard.
    </p>

    <div style="margin-top:22px; font-size:12px; color:#999;">
      — Dolphin Enterprise Team
    </div>
  </div>
  `

  // If attachFiles true and pdfUrl/csvUrl point to local files, attach them
  let attachments: AttachmentInput[] | undefined = undefined
  if (attachFiles) {
    attachments = []
    if (pdfUrl && !preferSignedUrls) {
      if (fs.existsSync(pdfUrl)) {
        attachments.push({ path: pdfUrl, filename: `${invoiceNo}.pdf` })
      }
    }
    if (csvUrl && !preferSignedUrls) {
      if (fs.existsSync(csvUrl)) {
        attachments.push({ path: csvUrl, filename: `${invoiceNo}.csv` })
      }
    }
  }

  await sendEmail(to, `Your Invoice ${invoiceNo} is ready`, html, attachments)
}

export const sendInvoiceReminderEmail = async (opts: {
  to: string
  invoiceNo: string
  amount: number | string
  pdfUrl?: string
  csvUrl?: string
}) => {
  const { to, invoiceNo, amount, pdfUrl, csvUrl } = opts

  const html = `
  <div style="font-family: Arial, sans-serif; max-width:700px; margin:auto; padding:24px; color:#111">
    <h2 style="margin-bottom: 8px; color: #dc2626;">Payment Reminder — Invoice ${invoiceNo}</h2>
    <p style="color:#555; margin-top:0;">Hello,</p>
    <p style="color:#555">This is a friendly reminder that your invoice <strong>${invoiceNo}</strong> with an outstanding amount of <strong>₹${Number(
    amount,
  ).toFixed(2)}</strong> is still pending payment.</p>

    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: 600; color: #991b1b;">Outstanding Amount: ₹${Number(
        amount,
      ).toFixed(2)}</p>
    </div>

    <div style="margin-top:16px;">
      ${
        pdfUrl || csvUrl
          ? `<p style="margin-bottom:8px;">Access your invoice:</p>
       ${
         pdfUrl
           ? `<p><a href="${pdfUrl}" style="color: #2563eb; text-decoration: underline;">Download PDF Invoice</a></p>`
           : ''
       }
       ${
         csvUrl
           ? `<p><a href="${csvUrl}" style="color: #2563eb; text-decoration: underline;">Download CSV breakdown</a></p>`
           : ''
       }`
          : ''
      }
    </div>

    <p style="color:#777; margin-top:20px; font-size:13px;">
      Please make the payment at your earliest convenience. If you have already made the payment, please ignore this reminder.
    </p>

    <p style="color:#777; margin-top:16px; font-size:13px;">
      If you have any questions or need assistance, please contact our support team.
    </p>

    <div style="margin-top:22px; font-size:12px; color:#999;">
      — Dolphin Enterprise Team
    </div>
  </div>
  `

  await sendEmail(to, `Payment Reminder: Invoice ${invoiceNo}`, html)
}

export const sendKycStatusEmail = async (opts: {
  to: string
  userName?: string
  status: 'verified' | 'rejected'
  reason?: string
}) => {
  const { to, userName, status, reason } = opts
  const safeName = userName || 'Merchant'
  const isApproved = status === 'verified'
  const subject = isApproved ? 'Your KYC has been approved' : 'Your KYC has been rejected'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 10px;">
      <h2 style="margin: 0 0 10px 0; color: ${isApproved ? '#166534' : '#991b1b'};">
        ${isApproved ? 'KYC Approved' : 'KYC Rejected'}
      </h2>
      <p style="margin: 0 0 12px 0; color: #374151;">Hello ${safeName},</p>
      <p style="margin: 0 0 14px 0; color: #374151;">
        Your KYC verification status has been updated to:
        <strong>${isApproved ? 'Approved' : 'Rejected'}</strong>.
      </p>
      ${
        !isApproved && reason
          ? `<div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 14px 0; border-radius: 6px;">
               <p style="margin: 0; color: #7f1d1d;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
             </div>`
          : ''
      }
      <p style="margin: 14px 0 0 0; color: #6b7280; font-size: 13px;">
        If you need help, please contact support from your dashboard.
      </p>
      <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px;">— Dolphin Enterprise Team</p>
    </div>
  `

  await sendEmail(to, subject, html)
}
