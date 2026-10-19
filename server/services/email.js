// ==========================================
// MohanaMantra 2K26 — Email Service
// ==========================================
// Sends a styled HTML email with the generated ID card attached.
//
// How it works:
//   1. Configures Nodemailer with Gmail SMTP
//   2. Builds a beautiful HTML email body
//   3. Attaches the ID card PNG as a file
//   4. Sends to the student's registered email
//
// You need a Gmail App Password (not your regular password):
//   1. Go to https://myaccount.google.com/apppasswords
//   2. Generate a new app password for "Mail"
//   3. Paste the 16-char password in your .env file
// ==========================================

const nodemailer = require("nodemailer");
const MailComposer = require("nodemailer/lib/mail-composer");
const { isConfiguredSecret, isValidEmailAddress } = require("./registration");
require("dotenv").config({ path: require("node:path").join(__dirname, "..", ".env"), quiet: true });

// Two ways to send through the official mailbox:
//   - Gmail API over HTTPS (port 443): works on hosts like Render Free that
//     block the SMTP ports. Used when OAuth credentials are present.
//   - Gmail SMTP app password: the original local/inline path, used otherwise.
function hasGmailApiConfig(config = process.env) {
  return isValidEmailAddress(config.GMAIL_USER) &&
    isConfiguredSecret(config.GMAIL_OAUTH_CLIENT_ID) &&
    isConfiguredSecret(config.GMAIL_OAUTH_CLIENT_SECRET) &&
    isConfiguredSecret(config.GMAIL_OAUTH_REFRESH_TOKEN);
}

function hasGmailSmtpConfig(config = process.env) {
  return isValidEmailAddress(config.GMAIL_USER) &&
    isConfiguredSecret(config.GMAIL_APP_PASSWORD?.replace(/\s/g, ""));
}

function isEmailConfigured(config = process.env) {
  return hasGmailApiConfig(config) || hasGmailSmtpConfig(config);
}

// Configure Gmail SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 20000,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ""),
  },
});

/**
 * Send the ID card email to the student
 *
 * @param {Object} params
 * @param {string} params.toEmail      - Student's email address
 * @param {string} params.studentName  - Student's full name
 * @param {string} params.ticketId     - Unique ticket ID
 * @param {string} params.college      - College name
 * @param {Buffer} params.idCardBuffer - PNG buffer of the generated ID card
 * @param {Buffer} [params.qrBuffer]   - Optional PNG buffer of the standalone QR code
 * @returns {Promise<Object>} Nodemailer send result
 */
async function sendIdCardEmail({ toEmail, studentName, ticketId, college, idCardBuffer, qrBuffer, paymentMode = "live" }) {
  if (!isValidEmailAddress(toEmail)) {
    const error = new Error("The entry pass recipient must be a single valid email address.");
    error.code = "INVALID_RECIPIENT";
    throw error;
  }
  const attachments = [
    {
      filename: `MohanaMantra_EntryPass_${ticketId}.png`,
      content: idCardBuffer,
      contentType: "image/png",
    },
  ];

  // If standalone QR buffer is provided, attach it as a separate file
  if (qrBuffer) {
    attachments.push({
      filename: `MohanaMantra_QRCode_${ticketId}.png`,
      content: qrBuffer,
      contentType: "image/png",
    });
  }

  const mailOptions = {
    from: `"MohanaMantra 2K26" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `${paymentMode === "test" ? "[TEST — NO CHARGE] " : "🎉 "}MohanaMantra 2K26 — Your Entry Pass & QR Code (${ticketId})`,
    html: buildEmailHtml(studentName, ticketId, college, paymentMode),
    attachments,
  };

  try {
    let result;
    if (hasGmailApiConfig()) {
      result = await sendViaGmailApi(mailOptions, toEmail);
    } else {
      result = await transporter.sendMail(mailOptions);
      if (!result.accepted?.some(address => String(address).toLowerCase() === toEmail.toLowerCase())) {
        throw new Error("The mail provider did not accept the entry pass recipient.");
      }
    }
    console.log(`📧 Entry-pass email accepted for ticket ${ticketId} with ${attachments.length} attachments`);
    return result;
  } catch (error) {
    console.error(`❌ Entry-pass email failed for ticket ${ticketId}:`, error.code || "DELIVERY_FAILED");
    throw error;
  }
}

// --- Gmail API transport (HTTPS, works where SMTP ports are blocked) ---
let cachedGmailClient = null;
function getGmailClient() {
  if (cachedGmailClient) return cachedGmailClient;
  const { google } = require("googleapis");
  const oauth2 = new google.auth.OAuth2(
    process.env.GMAIL_OAUTH_CLIENT_ID,
    process.env.GMAIL_OAUTH_CLIENT_SECRET,
  );
  oauth2.setCredentials({ refresh_token: process.env.GMAIL_OAUTH_REFRESH_TOKEN });
  cachedGmailClient = google.gmail({ version: "v1", auth: oauth2 });
  return cachedGmailClient;
}

// Reuse Nodemailer to build the RFC822 MIME (HTML + both PNG attachments), then
// hand the base64url-encoded bytes to the Gmail API instead of an SMTP socket.
async function sendViaGmailApi(mailOptions, toEmail) {
  const gmail = getGmailClient();
  const mime = await new MailComposer(mailOptions).compile().build();
  const raw = mime.toString("base64url");
  const res = await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  if (!res.data?.id) {
    throw new Error("Gmail API did not confirm the entry pass was queued for delivery.");
  }
  return { messageId: res.data.id, accepted: [toEmail], gmailApi: true };
}

/**
 * Build the HTML email body with inline styles (email clients don't support CSS files)
/**
 * Escape HTML special characters to prevent HTML injection attacks in email clients
 */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildEmailHtml(studentName, ticketId, college, paymentMode) {
  const test = paymentMode === "test";
  const safeName = escapeHtml(studentName);
  const safeTicketId = escapeHtml(ticketId);
  const safeCollege = escapeHtml(college);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#1a0a0e; font-family: 'Georgia', serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a0a0e; padding: 30px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#2a1218; border: 2px solid #d4a843; border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center; background: linear-gradient(180deg, #2a1218, #1a0a0e);">
              <h1 style="color: #d4a843; font-size: 32px; margin: 0; letter-spacing: 2px;">
                MOHANA MANTRA 2K26
              </h1>
              <p style="color: #c4a265; font-size: 14px; margin: 8px 0 0; letter-spacing: 4px;">
                ${test ? "TEST PAYMENT CONFIRMATION" : "ENTRY PASS CONFIRMATION"}
              </p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #d4a843; margin: 0;">
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="color: #fff9e9; font-size: 18px; margin: 0 0 15px;">
                Dear <strong style="color: #d4a843;">${safeName}</strong>,
              </p>
              <p style="color: #e2dccb; font-size: 15px; line-height: 1.7; margin: 0 0 15px;">
                ${test
                  ? "Your test registration fee of <strong style=\"color: #d4a843;\">₹1,000</strong> was verified. No real money was charged. This registration and its attachments are for testing and are not valid for event entry."
                  : "Welcome to MohanaMantra 2K26! Your registration is confirmed and the registration fee of <strong style=\"color: #d4a843;\">₹1,000</strong> has been received successfully. Your Razorpay receipt shows any additional checkout fee."}
              </p>
              <p style="color: #e2dccb; font-size: 15px; line-height: 1.7; margin: 0;">
                Your <strong style="color: #d4a843;">Entry Pass</strong> is attached to this email. 
                ${test ? "Use it to check the test card and local QR verification." : "Please save it on your phone or print it — you will need to show the QR code at the gate."}
              </p>
            </td>
          </tr>
          
          <!-- Details Box -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" style="background-color: #1a0a0e; border: 1px solid #b8922f; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 12px 20px; color: #c4a265; font-size: 13px;">TICKET ID</td>
                  <td style="padding: 12px 20px; color: #fff9e9; font-size: 16px; font-weight: bold; text-align: right;">${safeTicketId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; color: #c4a265; font-size: 13px; border-top: 1px solid #2a1218;">NAME</td>
                  <td style="padding: 12px 20px; color: #fff9e9; font-size: 16px; text-align: right; border-top: 1px solid #2a1218;">${safeName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; color: #c4a265; font-size: 13px; border-top: 1px solid #2a1218;">COLLEGE</td>
                  <td style="padding: 12px 20px; color: #fff9e9; font-size: 16px; text-align: right; border-top: 1px solid #2a1218;">${safeCollege}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Important Notice -->
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" style="background-color: #3a1c22; border-left: 4px solid #d4a843; border-radius: 4px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #d4a843; font-size: 14px; font-weight: bold; margin: 0 0 8px;">
                      ${test ? "TEST PASS — NOT VALID FOR ENTRY" : "⚠️ Important — Read Before Event Day"}
                    </p>
                    <ul style="color: #e2dccb; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">
                      <li>${test ? "This QR code belongs to the local test environment only" : "Show the QR code on your <strong>Entry Pass</strong> at the college gate"}</li>
                      <li>You can show it on your phone screen or bring a printed copy</li>
                      <li><strong style="color:#ff9999;">If your email app uses Dark Mode</strong>, the QR code colors may invert and fail to scan. Please turn off dark mode before showing it, or take a screenshot in light mode</li>
                      <li>${test ? "No real payment or event admission is confirmed by this test email" : "Check-in is recorded once per event session — do not share your pass"}</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px; text-align: center; border-top: 1px solid #b8922f;">
              <p style="color: #c4a265; font-size: 14px; font-style: italic; margin: 0;">
                United by Art. Inspired by Culture.
              </p>
              <p style="color: #888; font-size: 11px; margin: 10px 0 0;">
                This is an automated email from MohanaMantra 2K26. Do not reply to this email.
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

async function verifyEmailTransport() {
  if (hasGmailApiConfig()) {
    // Validate the OAuth refresh token without needing a Gmail read scope:
    // exchanging it for an access token proves the credentials are good.
    const { google } = require("googleapis");
    const oauth2 = new google.auth.OAuth2(
      process.env.GMAIL_OAUTH_CLIENT_ID,
      process.env.GMAIL_OAUTH_CLIENT_SECRET,
    );
    oauth2.setCredentials({ refresh_token: process.env.GMAIL_OAUTH_REFRESH_TOKEN });
    const { token } = await oauth2.getAccessToken();
    if (!token) throw new Error("Could not obtain a Gmail access token from the refresh token.");
    return { gmailApi: true };
  }
  if (!hasGmailSmtpConfig()) {
    throw new Error("No Gmail sender configured (need either an app password or OAuth credentials).");
  }
  return transporter.verify();
}

module.exports = { sendIdCardEmail, isEmailConfigured, hasGmailApiConfig, hasGmailSmtpConfig, verifyEmailTransport };
