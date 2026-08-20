// ==========================================
// MohanaMantra 2K26 — QR Code Generator
// ==========================================
// Generates a tamper-proof JWT token and renders it as a QR code image.
//
// How it works (in plain English):
//   1. We take the student's ticket_id and name
//   2. We sign them with our secret key using JWT (like a digital seal)
//   3. Nobody can forge a valid QR code without knowing our secret
//   4. The QR code contains a URL like: https://yourfest.com/verify/eyJhbGci...
//   5. When scanned, the gatekeeper app decodes and verifies the token
// ==========================================

const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
require("dotenv").config();

/**
 * Generate a signed JWT token for a student's ticket
 * @param {string} ticketId - The unique ticket ID (e.g., "MM26-A3F1B2")
 * @param {string} studentName - The student's full name
 * @param {string} secureToken - The random secure token stored in Firestore
 * @returns {string} The signed JWT token string
 */
function generateVerificationToken(ticketId, studentName, secureToken) {
  const payload = {
    tid: ticketId,
    name: studentName,
    stk: secureToken,
  };

  // Sign with our secret. Token never expires (we check status in DB instead)
  const token = jwt.sign(payload, process.env.JWT_SECRET || "mohanamantra2k26_fallback_secret");
  return token;
}

/**
 * Build the full verification URL that will be encoded in the QR code
 * @param {string} token - The signed JWT token
 * @returns {string} The full verification URL
 */
function buildVerificationUrl(token) {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  return `${baseUrl}/gatekeeper/verify/${token}`;
}

/**
 * Generate a QR code image as a PNG buffer
 * @param {string} ticketId - The unique ticket ID
 * @param {string} studentName - The student's full name
 * @param {string} secureToken - The random secure token
 * @returns {Promise<Buffer>} PNG image buffer of the QR code
 */
async function generateQRCode(ticketId, studentName, secureToken) {
  const token = generateVerificationToken(ticketId, studentName, secureToken);
  const verificationUrl = buildVerificationUrl(token);

  console.log(`🔐 QR Verification URL: ${verificationUrl.substring(0, 60)}...`);

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(verificationUrl, {
    type: "png",
    width: 300,
    margin: 2,
    color: {
      dark: "#1a0a0e",   // Dark maroon (matches our ID card theme)
      light: "#ffffff",   // White background
    },
    errorCorrectionLevel: "H", // Highest error correction (30% of QR can be damaged)
  });

  return qrBuffer;
}

module.exports = {
  generateVerificationToken,
  buildVerificationUrl,
  generateQRCode,
};
