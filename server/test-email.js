// ==========================================
// MohanaMantra 2K26 — Full Email & Attachments Test Script
// ==========================================
// Run this with: node test-email.js (inside server/ directory)
// It generates a sample ID Card + Standalone QR Code and sends a test email with both attached!
// ==========================================

const { sendIdCardEmail } = require("./services/email");
const { generateIdCard } = require("./services/idcard");
const { generateQRCode } = require("./services/qr");
require("dotenv").config();

async function runEmailTest() {
  console.log("📧 Testing MohanaMantra Email Automation with Attachments...\n");

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword || gmailAppPassword.includes("YOUR_GMAIL_APP_PASSWORD")) {
    console.error("❌ Error: GMAIL_USER or GMAIL_APP_PASSWORD is not configured in server/.env");
    console.log("   Please set GMAIL_APP_PASSWORD to your 16-character Google App Password in server/.env\n");
    return;
  }

  const testStudent = {
    ticketId: "MM26-TEST01",
    name: "Sameer Reddy (Test)",
    college: "Mohan Babu University",
    rollNo: "22CS101",
    secureToken: "test_secure_token_12345",
  };

  try {
    console.log("🎨 Generating sample ID Card image...");
    const idCardBuffer = await generateIdCard(testStudent);

    console.log("🔐 Generating standalone QR Code image...");
    const qrBuffer = await generateQRCode(testStudent.ticketId, testStudent.name, testStudent.secureToken);

    console.log(`⏳ Sending email to ${gmailUser} with 2 attachments (ID Card + QR Code)...`);
    const result = await sendIdCardEmail({
      toEmail: gmailUser,
      studentName: testStudent.name,
      ticketId: testStudent.ticketId,
      college: testStudent.college,
      idCardBuffer,
      qrBuffer,
    });

    console.log(`\n🎉 EMAIL SENT SUCCESSFULLY!`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Attachments: 1) MohanaMantra_EntryPass_${testStudent.ticketId}.png`);
    console.log(`                2) MohanaMantra_QRCode_${testStudent.ticketId}.png`);
    console.log(`\n📂 Check inbox (${gmailUser}) to view the test email!`);
  } catch (error) {
    console.error("\n❌ Email Test Failed!");
    console.error(`   Error details: ${error.message}`);
    if (error.message.includes("Invalid login") || error.message.includes("535")) {
      console.log("\n💡 Solution: Double check that you generated a 16-character App Password at https://myaccount.google.com/apppasswords");
    }
  }
}

runEmailTest();
