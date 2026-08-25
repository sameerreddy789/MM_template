// ==========================================
// MohanaMantra 2K26 — Registration & Mail Generation for "Test 002"
// ==========================================

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { generateIdCard } = require("./services/idcard");
const { generateQRCode } = require("./services/qr");
const { sendIdCardEmail } = require("./services/email");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize Firebase Admin
const keyPath = path.join(__dirname, "serviceAccountKey.json");
if (!fs.existsSync(keyPath)) {
  console.error("❌ serviceAccountKey.json not found in server/ directory!");
  process.exit(1);
}

const serviceAccount = require("./serviceAccountKey.json");
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();
console.log(`✅ Firebase Admin initialized (${serviceAccount.project_id})`);

function generateTicketId() {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MM26-T002-${randomHex}`;
}

async function runTest002Registration() {
  console.log("\n==========================================");
  console.log("🚀 MOHANA MANTRA 2K26 — TEST 002 REGISTRATION & MAIL GENERATION");
  console.log("==========================================\n");

  const ticketId = generateTicketId();
  const secureToken = crypto.randomBytes(16).toString("hex");

  const student = {
    ticketId,
    name: "Test 002",
    email: process.env.GMAIL_USER || "mohanamantra2k26official@gmail.com",
    phone: "9988776655",
    college: "Mohan Babu University",
    rollNo: "22CS002",
    orderId: `order_test_${Date.now()}`,
    paymentId: `pay_test_${Date.now()}`,
    paymentStatus: "Paid",
    checkInStatus: "Not Checked In",
    checkedInAt: null,
    secureToken,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    // STEP 1: Save to Firestore
    console.log(`📥 1. Saving registration record to Firestore (${ticketId})...`);
    await db.collection("registrations").doc(ticketId).set(student);
    console.log(`   ✅ Saved to Firestore document: registrations/${ticketId}`);

    // STEP 2: Generate ID Card & QR Code
    console.log(`\n🎨 2. Generating ID Card PNG image...`);
    const idCardBuffer = await generateIdCard(student);
    console.log(`   ✅ ID Card generated (${(idCardBuffer.length / 1024).toFixed(1)} KB)`);

    console.log(`\n🔐 3. Generating Standalone QR Code PNG...`);
    const qrBuffer = await generateQRCode(ticketId, student.name, secureToken);
    console.log(`   ✅ QR Code generated (${(qrBuffer.length / 1024).toFixed(1)} KB)`);

    // STEP 3: Save local output files
    const outputDir = path.join(__dirname, "test_output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const localQrPath = path.join(outputDir, `qr_${ticketId}.png`);
    const localIdPath = path.join(outputDir, `idcard_${ticketId}.png`);
    fs.writeFileSync(localQrPath, qrBuffer);
    fs.writeFileSync(localIdPath, idCardBuffer);
    console.log(`\n💾 4. Saved PNG images locally:`);
    console.log(`   👉 QR Code: ${localQrPath}`);
    console.log(`   👉 ID Card: ${localIdPath}`);

    // STEP 4: Send confirmation email with both attachments
    console.log(`\n📧 5. Sending confirmation email to ${student.email}...`);
    const emailResult = await sendIdCardEmail({
      toEmail: student.email,
      studentName: student.name,
      ticketId,
      college: student.college,
      idCardBuffer,
      qrBuffer,
    });
    console.log(`   ✅ Email delivered successfully to ${student.email}`);
    console.log(`   Message ID: ${emailResult.messageId}`);

    console.log("\n==========================================");
    console.log("🎉 TEST 002 REGISTRATION & MAIL SUCCESSFUL!");
    console.log("==========================================");
    console.log(`   Name        : ${student.name}`);
    console.log(`   Ticket ID   : ${student.ticketId}`);
    console.log(`   Roll No     : ${student.rollNo}`);
    console.log(`   Email Sent  : ${student.email}`);
    console.log(`   QR Image    : ./server/test_output/qr_${ticketId}.png`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("\n❌ Registration / Mail Generation Failed:", error);
  }
}

runTest002Registration();
