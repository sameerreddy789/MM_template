// ==========================================
// MohanaMantra 2K26 — Razorpay Order Creation Test
// ==========================================
// Run this with: node test-razorpay.js (inside server/ directory)
// It tests whether Razorpay credentials can successfully create a sample order.
// ==========================================

const Razorpay = require("razorpay");
require("dotenv").config({ path: require("node:path").join(__dirname, ".env.payment-test"), quiet: true });

async function runRazorpayTest() {
  console.log("💳 Testing Razorpay API Order Creation...\n");

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  console.log(`   Mode: ${/^rzp_test_/.test(keyId || "") ? "test" : "unconfigured"}`);

  if (process.env.PAYMENT_MODE !== "test" || !/^rzp_test_[A-Za-z0-9]+$/.test(keyId || "") ||
      !require("./services/registration").isConfiguredSecret(keySecret)) {
    console.error("Configure the separate test environment with node server/setup-payment-test.js. Live key pairs are refused.");
    process.exitCode = 1;
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
    console.error(`   Error code: ${error.statusCode || error.code || error.name || "UNKNOWN"}`);
    if (error.statusCode === 401) {
      console.log("\n💡 Solution: Your RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is invalid or mismatched. Please check your Razorpay Dashboard.");
    }
  }
}

runRazorpayTest();
