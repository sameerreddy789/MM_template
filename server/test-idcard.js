// ==========================================
// MohanaMantra 2K26 — ID Card Test Script
// ==========================================
// Run this with: node test-idcard.js
// It generates a sample ID card and saves it to ./test_output/
// No Firebase or Razorpay needed — just tests the image generation.
// ==========================================

const { generateIdCard } = require("./services/idcard");
const fs = require("fs");
const path = require("path");

async function runTest() {
  console.log("🧪 Testing ID Card Generation...\n");

  const testStudent = {
    ticketId: "MM26-A3F1B2",
    name: "Sameer Reddy",
    college: "Mohan Babu University",
    rollNo: "22CS101",
    secureToken: "abc123def456test789",
  };

  try {
    const cardBuffer = await generateIdCard(testStudent);

    // Save to test_output directory
    const outputDir = path.join(__dirname, "test_output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `test_card_${testStudent.ticketId}.png`);
    fs.writeFileSync(outputPath, cardBuffer);

    console.log(`\n✅ Test card saved to: ${outputPath}`);
    console.log(`   File size: ${(cardBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`\n📂 Open the file to verify the layout!`);
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

runTest();
