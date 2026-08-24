// ==========================================
// MohanaMantra 2K26 — Razorpay Order Creation Test
// ==========================================
// Run this with: node test-razorpay.js (inside server/ directory)
// It tests whether Razorpay credentials can successfully create a sample order.
// ==========================================

const Razorpay = require("razorpay");
require("dotenv").config();

async function runRazorpayTest() {
  console.log("💳 Testing Razorpay API Order Creation...\n");

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log(`   Key ID     : ${keyId || "NOT SET"}`);
  console.log(`   Key Secret : ${keySecret ? keySecret.substring(0, 5) + "*****" : "NOT SET"}\n`);

  if (!keyId || !keySecret || keySecret.includes("YOUR_RAZORPAY_KEY_SECRET")) {
    console.error("❌ Error: RAZORPAY_KEY_SECRET is not configured in server/.env!");
    console.log("   Please set your real Razorpay Key Secret in server/.env or Render environment variables.\n");
    return;
  }

  try {
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    console.log("⏳ Sending order creation request to Razorpay servers...");
    const order = await razorpay.orders.create({
      amount: 100000, // ₹1000 in paise
      currency: "INR",
      receipt: `test_${Date.now()}`,
      notes: {
        test: "MohanaMantra Payment Test",
      },
    });

    console.log(`\n🎉 RAZORPAY ORDER CREATION SUCCESSFUL!`);
    console.log(`   Order ID : ${order.id}`);
    console.log(`   Amount   : ₹${order.amount / 100} ${order.currency}`);
    console.log(`   Status   : ${order.status}`);
  } catch (error) {
    console.error("\n❌ Razorpay Order Creation Failed!");
    console.error(`   Error Message: ${error.message}`);
    if (error.statusCode === 401) {
      console.log("\n💡 Solution: Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is invalid or mismatched. Please check your Razorpay Dashboard.");
    }
  }
}

runRazorpayTest();
