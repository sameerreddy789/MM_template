// ==========================================
// MohanaMantra 2K26 — Full Registration & Payment Test Simulation
// ==========================================
// Run this with: node test-full-pipeline.js (inside server/ directory)
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
  return `MM26-${randomHex}`;
}

async function runFullPipelineSimulation() {
  console.log("\n==========================================");
  console.log("🚀 MOHANA MANTRA 2K26 — FULL TEST SIMULATION");
  console.log("==========================================\n");

  const ticketId = generateTicketId();
  const secureToken = crypto.randomBytes(16).toString("hex");

  const student = {
    ticketId,
    name: "Sameer Reddy",
    email: process.env.GMAIL_USER || "mohanamantra2k26official@gmail.com",
    phone: "9876543210",
    college: "Mohan Babu University",
    rollNo: "22CS101",
    orderId: `order_test_${Date.now()}`,
    paymentId: `pay_test_${Date.now()}`,
    paymentStatus: "Paid",
    checkInStatus: "Not Checked In",
    checkedInAt: null,
    secureToken,
    createdAt: FieldValue.serverTimestamp(),
  };

  try {
    // ----------------------------------------------------
    // STEP 1: Save Student Record to Firestore
    // ----------------------------------------------------
    console.log(`📥 1. Saving registration record to Firestore (${ticketId})...`);
    await db.collection("registrations").doc(ticketId).set(student);
    console.log(`   ✅ Saved to Firestore document: registrations/${ticketId}`);

    // ----------------------------------------------------
    // STEP 2: Generate ID Card PNG & Standalone QR PNG
    // ----------------------------------------------------
    console.log(`\n🎨 2. Generating ID Card PNG image...`);
    const idCardBuffer = await generateIdCard(student);
    console.log(`   ✅ ID Card generated (${(idCardBuffer.length / 1024).toFixed(1)} KB)`);

    console.log(`\n🔐 3. Generating Standalone QR Code PNG...`);
    const qrBuffer = await generateQRCode(ticketId, student.name, secureToken);
    console.log(`   ✅ QR Code generated (${(qrBuffer.length / 1024).toFixed(1)} KB)`);

    // ----------------------------------------------------
    // STEP 3: Save QR Code image locally for testing
    // ----------------------------------------------------
    const outputDir = path.join(__dirname, "test_output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const localQrPath = path.join(outputDir, `test_qr_${ticketId}.png`);
    fs.writeFileSync(localQrPath, qrBuffer);
    console.log(`\n💾 4. Saved QR image locally for drag & drop test:`);
    console.log(`   👉 ${localQrPath}`);

    // ----------------------------------------------------
    // STEP 4: Email both attachments to Gmail inbox
    // ----------------------------------------------------
    console.log(`\n📧 5. Sending confirmation email with both attachments...`);
    const emailResult = await sendIdCardEmail({
      toEmail: student.email,
      studentName: student.name,
      ticketId,
      college: student.college,
      idCardBuffer,
      qrBuffer,
    });
    console.log(`   ✅ Email delivered to ${student.email}`);
    console.log(`   Message ID: ${emailResult.messageId}`);

    // ----------------------------------------------------
    // SUCCESS SUMMARY
    // ----------------------------------------------------
    console.log("\n==========================================");
    console.log("🎉 FULL REGISTRATION SIMULATION COMPLETE!");
    console.log("==========================================");
    console.log(`   Student Name : ${student.name}`);
    console.log(`   Ticket ID    : ${student.ticketId}`);
    console.log(`   College      : ${student.college}`);
    console.log(`   Status       : ${student.paymentStatus}`);
    console.log(`   Local QR File: ./server/test_output/test_qr_${ticketId}.png`);
    console.log(`\n👉 NEXT STEP: Open http://localhost:5173/gatekeeper and verify Ticket ID '${ticketId}' or Drag & Drop the QR image!`);
    console.log("==========================================\n");
  } catch (error) {
    console.error("\n❌ Simulation Failed:", error);
  }
}

runFullPipelineSimulation();
