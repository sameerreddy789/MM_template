// ==========================================
// MohanaMantra 2K26 — Email Service (Cloud Functions)
// ==========================================
// Sends a styled HTML email with the generated ID card attached using Nodemailer.
// ==========================================

const nodemailer = require("nodemailer");

/**
 * Send the ID card email to the student
 */
async function sendIdCardEmail({ toEmail, studentName, ticketId, college, idCardBuffer }) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"MohanaMantra 2K26" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: `🎉 MohanaMantra 2K26 — Your Entry Pass is Ready! (${ticketId})`,
    html: buildEmailHtml(studentName, ticketId, college),
    attachments: [
      {
        filename: `MohanaMantra_EntryPass_${ticketId}.png`,
        content: idCardBuffer,
        contentType: "image/png",
      },
    ],
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${toEmail} — Message ID: ${result.messageId}`);
    return result;
  } catch (error) {
    console.error(`❌ Email send failed for ${toEmail}:`, error.message);
    throw error;
  }
}

function buildEmailHtml(studentName, ticketId, college) {
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
          
          <tr>
            <td style="padding: 40px 30px 20px; text-align: center; background: linear-gradient(180deg, #2a1218, #1a0a0e);">
              <h1 style="color: #d4a843; font-size: 32px; margin: 0; letter-spacing: 2px;">
                MOHANA MANTRA 2K26
              </h1>
              <p style="color: #c4a265; font-size: 14px; margin: 8px 0 0; letter-spacing: 4px;">
                ENTRY PASS CONFIRMATION
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #d4a843; margin: 0;">
            </td>
          </tr>
          
          <tr>
            <td style="padding: 30px 40px;">
              <p style="color: #fff9e9; font-size: 18px; margin: 0 0 15px;">
                Dear <strong style="color: #d4a843;">${studentName}</strong>,
              </p>
              <p style="color: #e2dccb; font-size: 15px; line-height: 1.7; margin: 0 0 15px;">
                Welcome to MohanaMantra 2K26! Your registration is confirmed and payment of 
                <strong style="color: #d4a843;">₹1,000</strong> has been received successfully.
              </p>
              <p style="color: #e2dccb; font-size: 15px; line-height: 1.7; margin: 0;">
                Your <strong style="color: #d4a843;">Entry Pass</strong> is attached to this email. 
                Please save it on your phone or print it — you will need to show the QR code at the gate.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" style="background-color: #1a0a0e; border: 1px solid #b8922f; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 12px 20px; color: #c4a265; font-size: 13px;">TICKET ID</td>
                  <td style="padding: 12px 20px; color: #fff9e9; font-size: 16px; font-weight: bold; text-align: right;">${ticketId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; color: #c4a265; font-size: 13px; border-top: 1px solid #2a1218;">NAME</td>
                  <td style="padding: 12px 20px; color: #fff9e9; font-size: 16px; text-align: right; border-top: 1px solid #2a1218;">${studentName}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 20px; color: #c4a265; font-size: 13px; border-top: 1px solid #2a1218;">COLLEGE</td>
                  <td style="padding: 12px 20px; color: #fff9e9; font-size: 16px; text-align: right; border-top: 1px solid #2a1218;">${college}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 0 40px 20px;">
              <table width="100%" style="background-color: #3a1c22; border-left: 4px solid #d4a843; border-radius: 4px;">
                <tr>
                  <td style="padding: 15px 20px;">
                    <p style="color: #d4a843; font-size: 14px; font-weight: bold; margin: 0 0 8px;">
                      ⚠️ Important — Read Before Event Day
                    </p>
                    <ul style="color: #e2dccb; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 18px;">
                      <li>Show the QR code on your <strong>Entry Pass</strong> at the college gate</li>
                      <li>You can show it on your phone screen or bring a printed copy</li>
                      <li>Each QR code can only be scanned <strong>once</strong> — do not share your pass</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
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

module.exports = { sendIdCardEmail };
