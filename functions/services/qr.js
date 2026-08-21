// ==========================================
// MohanaMantra 2K26 — QR Code Generator (Cloud Functions)
// ==========================================
// Generates a tamper-proof JWT token and renders it as a QR code image buffer.
// ==========================================

const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");

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

  const secret = process.env.JWT_SECRET || "mohanamantra2k26_fallback_secret";
  return jwt.sign(payload, secret);
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
      dark: "#1a0a0e",   // Dark maroon (matches ID card theme)
      light: "#ffffff",   // White background
    },
    errorCorrectionLevel: "H", // Highest error correction
  });

  return qrBuffer;
}

module.exports = {
  generateVerificationToken,
  buildVerificationUrl,
  generateQRCode,
};
