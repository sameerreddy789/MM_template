// ==========================================
// MohanaMantra 2K26 — ID Card Generator
// ==========================================
// Generates a premium portrait ID card image programmatically.
//
// Layout (Portrait 800x1100):
//   ┌─────────────────────────┐
//   │  Golden Corner Borders  │
//   │                         │
//   │     [MM Logo - 160px]   │
//   │                         │
//   │   MOHANA MANTRA 2K26    │
//   │      ─ ENTRY PASS ─     │
//   │                         │
//   │  NAME:     Sameer Reddy │
//   │  COLLEGE:  MBU          │
//   │  ROLL NO:  22CS101      │
//   │  TICKET:   MM26-A3F1B2  │
//   │                         │
//   │     [QR Code - 220px]   │
//   │   "Scan for verification"│
//   │                         │
//   │   [College Logo - 80px] │
//   │                         │
//   │  United by Art. Inspired│
//   │       by Culture.       │
//   └─────────────────────────┘
//
// Uses @napi-rs/canvas for text rendering and sharp for image compositing.
// ==========================================

const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { generateQRCode } = require("./qr");

// Card dimensions (portrait)
const CARD_WIDTH = 800;
const CARD_HEIGHT = 1100;

// Color palette (matching the MohanaMantra theme)
const COLORS = {
  background: "#1a0a0e",       // Deep maroon-black
  gold: "#d4a843",             // Primary gold
  goldLight: "#e5c384",        // Light gold for text
  goldDark: "#b8922f",         // Darker gold for borders
  white: "#fff9e9",            // Warm white
  textMuted: "#c4a265",        // Muted gold for labels
  borderGlow: "rgba(212, 168, 67, 0.3)", // Subtle gold glow
};

/**
 * Draw the complete ID card and return it as a PNG buffer
 *
 * @param {Object} studentData
 * @param {string} studentData.ticketId    - e.g. "MM26-A3F1B2"
 * @param {string} studentData.name        - e.g. "Sameer Reddy"
 * @param {string} studentData.college     - e.g. "Mohan Babu University"
 * @param {string} studentData.rollNo      - e.g. "22CS101"
 * @param {string} studentData.secureToken - Crypto token for QR verification
 * @returns {Promise<Buffer>} PNG image buffer
 */
async function generateIdCard(studentData) {
  const { ticketId, name, college, rollNo, secureToken } = studentData;

  // =========================================
  // 1. Create the canvas
  // =========================================
  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  // =========================================
  // 2. Draw dark background
  // =========================================
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // =========================================
  // 3. Draw golden border (double border effect)
  // =========================================
  // Outer border
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, CARD_WIDTH - 40, CARD_HEIGHT - 40);

  // Inner border
  ctx.strokeStyle = COLORS.goldDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, CARD_WIDTH - 60, CARD_HEIGHT - 60);

  // Corner ornaments (simple L-shaped golden accents)
  drawCornerOrnaments(ctx);

  // =========================================
  // 4. Draw title "MOHANA MANTRA 2K26"
  // =========================================
  ctx.textAlign = "center";

  // Main title
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 52px serif";
  ctx.fillText("MOHANA MANTRA", CARD_WIDTH / 2, 240);
  ctx.font = "bold 48px serif";
  ctx.fillStyle = COLORS.goldLight;
  ctx.fillText("2K26", CARD_WIDTH / 2, 295);

  // Decorative line
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(200, 315);
  ctx.lineTo(600, 315);
  ctx.stroke();

  // "ENTRY PASS" subtitle
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "22px serif";
  ctx.fillText("✦  ENTRY PASS  ✦", CARD_WIDTH / 2, 345);

  // Another decorative line
  ctx.beginPath();
  ctx.moveTo(200, 360);
  ctx.lineTo(600, 360);
  ctx.stroke();

  // =========================================
  // 5. Draw student details
  // =========================================
  const detailsStartY = 420;
  const labelX = 80;
  const valueX = 280;
  const lineSpacing = 65;

  const details = [
    { label: "NAME", value: name },
    { label: "COLLEGE", value: college },
    { label: "ROLL NO", value: rollNo },
    { label: "TICKET ID", value: ticketId },
  ];

  details.forEach((detail, index) => {
    const y = detailsStartY + index * lineSpacing;

    // Label (golden, uppercase)
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(detail.label + ":", labelX, y);

    // Value (white, larger)
    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(detail.value, valueX, y);

    // Underline
    ctx.strokeStyle = COLORS.goldDark;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(valueX, y + 8);
    ctx.lineTo(CARD_WIDTH - 80, y + 8);
    ctx.stroke();
  });

  // =========================================
  // 6. "Scan for verification" text
  // =========================================
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "italic 16px serif";
  ctx.fillText("Scan QR code at gate for verification", CARD_WIDTH / 2, 920);

  // =========================================
  // 7. Footer tagline
  // =========================================
  // Bottom decorative line
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, 1030);
  ctx.lineTo(700, 1030);
  ctx.stroke();

  ctx.fillStyle = COLORS.goldLight;
  ctx.font = "italic 18px serif";
  ctx.fillText("United by Art. Inspired by Culture.", CARD_WIDTH / 2, 1060);

  // =========================================
  // 8. Convert canvas to PNG buffer
  // =========================================
  const cardBuffer = canvas.toBuffer("image/png");

  // =========================================
  // 9. Generate QR code
  // =========================================
  const qrBuffer = await generateQRCode(ticketId, name, secureToken);

  // =========================================
  // 10. Composite logo + QR onto the card using Sharp
  // =========================================
  const composites = [];

  // --- Add QR Code (centered, below details) ---
  const qrSize = 220;
  const qrX = Math.round((CARD_WIDTH - qrSize) / 2);
  const qrY = 685;

  const qrResized = await sharp(qrBuffer).resize(qrSize, qrSize).png().toBuffer();
  composites.push({
    input: qrResized,
    left: qrX,
    top: qrY,
  });

  // --- Add MohanaMantra Logo (centered, top) ---
  const logoPath = path.join(__dirname, "..", "assets", "logo.webp");
  if (fs.existsSync(logoPath)) {
    const logoSize = 160;
    const logoResized = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    composites.push({
      input: logoResized,
      left: Math.round((CARD_WIDTH - logoSize) / 2),
      top: 50,
    });
  } else {
    console.warn("⚠️  Logo not found at:", logoPath);
  }

  // --- Add College Logo (if exists) ---
  const collegeLogoPath = path.join(__dirname, "..", "assets", "college_logo.png");
  if (fs.existsSync(collegeLogoPath)) {
    const collegLogoSize = 80;
    const collegeLogoResized = await sharp(collegeLogoPath)
      .resize(collegLogoSize, collegLogoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    composites.push({
      input: collegeLogoResized,
      left: Math.round((CARD_WIDTH - collegLogoSize) / 2),
      top: 940,
    });
  }

  // Final composite
  const finalCard = await sharp(cardBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  console.log(`🎫 ID Card generated for ${name} (${ticketId}) — ${(finalCard.length / 1024).toFixed(1)} KB`);

  return finalCard;
}

/**
 * Draw simple golden L-shaped corner ornaments
 */
function drawCornerOrnaments(ctx) {
  const ornamentSize = 40;
  const offset = 15;
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2.5;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(offset, offset + ornamentSize);
  ctx.lineTo(offset, offset);
  ctx.lineTo(offset + ornamentSize, offset);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH - offset - ornamentSize, offset);
  ctx.lineTo(CARD_WIDTH - offset, offset);
  ctx.lineTo(CARD_WIDTH - offset, offset + ornamentSize);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(offset, CARD_HEIGHT - offset - ornamentSize);
  ctx.lineTo(offset, CARD_HEIGHT - offset);
  ctx.lineTo(offset + ornamentSize, CARD_HEIGHT - offset);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(CARD_WIDTH - offset - ornamentSize, CARD_HEIGHT - offset);
  ctx.lineTo(CARD_WIDTH - offset, CARD_HEIGHT - offset);
  ctx.lineTo(CARD_WIDTH - offset, CARD_HEIGHT - offset - ornamentSize);
  ctx.stroke();
}

module.exports = { generateIdCard };
