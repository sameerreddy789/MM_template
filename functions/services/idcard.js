// ==========================================
// MohanaMantra 2K26 — ID Card Generator (Cloud Functions)
// ==========================================
// Generates a premium portrait ID card image programmatically using @napi-rs/canvas & sharp.
// ==========================================

const { createCanvas } = require("@napi-rs/canvas");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { generateQRCode } = require("./qr");

// Card dimensions (portrait)
const CARD_WIDTH = 800;
const CARD_HEIGHT = 1100;

// Color palette
const COLORS = {
  background: "#1a0a0e",       // Deep maroon-black
  gold: "#d4a843",             // Primary gold
  goldLight: "#e5c384",        // Light gold for text
  goldDark: "#b8922f",         // Darker gold for borders
  white: "#fff9e9",            // Warm white
  textMuted: "#c4a265",        // Muted gold for labels
};

/**
 * Draw the complete ID card and return it as a PNG buffer
 */
async function generateIdCard(studentData) {
  const { ticketId, name, college, rollNo, secureToken } = studentData;

  const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Outer border
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, CARD_WIDTH - 40, CARD_HEIGHT - 40);

  // Inner border
  ctx.strokeStyle = COLORS.goldDark;
  ctx.lineWidth = 1;
  ctx.strokeRect(30, 30, CARD_WIDTH - 60, CARD_HEIGHT - 60);

  // Corner accents
  drawCornerOrnaments(ctx);

  // Title
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.gold;
  ctx.font = "bold 44px serif";
  ctx.fillText("MOHANA MANTRA", CARD_WIDTH / 2, 105);

  ctx.font = "bold 38px serif";
  ctx.fillStyle = COLORS.goldLight;
  ctx.fillText("2K26 PASS", CARD_WIDTH / 2, 155);

  // Decorative line
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(180, 175);
  ctx.lineTo(620, 175);
  ctx.stroke();

  // Subtitle
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "20px serif";
  ctx.fillText("✦  OFFICIAL FEST PASS  ✦", CARD_WIDTH / 2, 205);

  ctx.beginPath();
  ctx.moveTo(180, 222);
  ctx.lineTo(620, 222);
  ctx.stroke();

  // Student details
  const detailsStartY = 285;
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

    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.textMuted;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(detail.label + ":", labelX, y);

    ctx.fillStyle = COLORS.white;
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(detail.value, valueX, y);

    ctx.strokeStyle = COLORS.goldDark;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(valueX, y + 8);
    ctx.lineTo(CARD_WIDTH - 80, y + 8);
    ctx.stroke();
  });

  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = "italic 16px serif";
  ctx.fillText("Scan QR code at gate for entry verification", CARD_WIDTH / 2, 800);

  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, 1030);
  ctx.lineTo(700, 1030);
  ctx.stroke();

  ctx.fillStyle = COLORS.goldLight;
  ctx.font = "italic 18px serif";
  ctx.fillText("United by Art. Inspired by Culture.", CARD_WIDTH / 2, 1060);

  const cardBuffer = canvas.toBuffer("image/png");
  const qrBuffer = await generateQRCode(ticketId, name, secureToken);

  const composites = [];

  const qrSize = 230;
  const qrX = Math.round((CARD_WIDTH - qrSize) / 2);
  const qrY = 550;

  const qrResized = await sharp(qrBuffer).resize(qrSize, qrSize).png().toBuffer();
  composites.push({
    input: qrResized,
    left: qrX,
    top: qrY,
  });

  // Left Logo: MM Logo
  const logoPath = path.join(__dirname, "..", "assets", "logo.webp");
  const fallbackLogoPath = path.join(__dirname, "..", "..", "server", "assets", "logo.webp");
  const activeLogoPath = fs.existsSync(logoPath) ? logoPath : (fs.existsSync(fallbackLogoPath) ? fallbackLogoPath : null);

  if (activeLogoPath) {
    const logoW = 120;
    const logoH = 120;
    const logoResized = await sharp(activeLogoPath)
      .resize(logoW, logoH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    composites.push({
      input: logoResized,
      left: 55,
      top: 55,
    });
  }

  // Right Logo: College Griffin Emblem
  const collegeLogoPath = path.join(__dirname, "..", "assets", "college_logo.png");
  const fallbackCollegeLogoPath = path.join(__dirname, "..", "..", "server", "assets", "college_logo.png");
  const activeCollegeLogoPath = fs.existsSync(collegeLogoPath) ? collegeLogoPath : (fs.existsSync(fallbackCollegeLogoPath) ? fallbackCollegeLogoPath : null);

  if (activeCollegeLogoPath) {
    const collegLogoW = 120;
    const collegLogoH = 130;
    const collegeLogoResized = await sharp(activeCollegeLogoPath)
      .resize(collegLogoW, collegLogoH, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    composites.push({
      input: collegeLogoResized,
      left: CARD_WIDTH - 55 - collegLogoW,
      top: 50,
    });
  }

  const finalCard = await sharp(cardBuffer)
    .composite(composites)
    .png()
    .toBuffer();

  console.log(`🎫 ID Card generated for ${name} (${ticketId}) — ${(finalCard.length / 1024).toFixed(1)} KB`);

  return finalCard;
}

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
