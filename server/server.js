// ==========================================
// MohanaMantra 2K26 — Backend Server
// ==========================================
// This is the main Express server that handles:
//   1. Razorpay order creation (POST /api/register)
//   2. Payment webhook verification (POST /api/payment-webhook)
//   3. Student verification for gatekeeper (GET /api/verify/:token) [Step 5]
//
// Architecture:
//   - Firebase Firestore = Database (student records, payment status, check-in)
//   - Express.js = Persistent server (handles heavy tasks like ID card generation)
//   - Razorpay = Payment gateway
// ==========================================

const express = require("express");
const Razorpay = require("razorpay");
const admin = require("firebase-admin");
const crypto = require("crypto");
const cors = require("cors");
const helmet = require("helmet");
const { generateIdCard } = require("./services/idcard");
const { sendIdCardEmail } = require("./services/email");
require("dotenv").config();

// ==========================================
// 1. FIREBASE ADMIN INITIALIZATION
// ==========================================
// Download your serviceAccountKey.json from:
//   Firebase Console → Project Settings → Service Accounts → Generate New Private Key
// Place it in the server/ directory.

const { cert } = require("firebase-admin/app");
const fs = require("fs");
const path = require("path");

let serviceAccount = null;
const keyPath = path.join(__dirname, "serviceAccountKey.json");

if (fs.existsSync(keyPath)) {
  serviceAccount = require("./serviceAccountKey.json");
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", err.message);
  }
}

if (serviceAccount) {
  admin.initializeApp({
    credential: cert(serviceAccount),
  });
  console.log(`✅ Firebase Admin connected to Firestore (${serviceAccount.project_id})`);
} else {
  console.error("⚠️ Firebase Admin NOT initialized — service account missing.");
}

const db = admin.firestore();
console.log("✅ Firebase Admin connected to Firestore");

// ==========================================
// 2. EXPRESS APP SETUP
// ==========================================
const app = express();

// Security headers
app.use(helmet());

// CORS — allow your frontend to talk to this backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// JSON body parser with RAW BODY preservation
// Why? Razorpay webhook verification needs the EXACT raw bytes of the request
// body to compute the HMAC signature. If we parse it to JSON first, the
// signature won't match because JSON.stringify() doesn't guarantee the same
// byte order as the original payload.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// ==========================================
// 3. RAZORPAY INSTANCE
// ==========================================
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

console.log("✅ Razorpay client initialized");

// ==========================================
// 4. HELPER — Generate Ticket ID
// ==========================================
// Format: MM26-A3F1B2 (prefix + 6 random hex chars, uppercase)
// This gives us 16 million unique combinations — more than enough for a college fest.
function generateTicketId() {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MM26-${randomHex}`;
}

// ==========================================
// 5. PIPELINE — Generate ID Card + Send Email
// ==========================================
// This is the full pipeline that runs after a successful payment:
//   1. Generate the ID card image (with QR code, logo, student details)
//   2. Email it to the student as an attachment
//
// It's called as a background task from the webhook handler so it doesn't
// block the webhook response to Razorpay.
async function generateIdCardAndSendEmail({ ticketId, name, college, rollNo, email, secureToken }) {
  console.log(`\n🎨 Starting ID card pipeline for ${name} (${ticketId})...`);

  // Step 1: Generate the ID card image
  const idCardBuffer = await generateIdCard({
    ticketId,
    name,
    college,
    rollNo,
    secureToken,
  });

  console.log(`✅ ID card image generated (${(idCardBuffer.length / 1024).toFixed(1)} KB)`);

  // Step 2: Send the email with the ID card attached
  await sendIdCardEmail({
    toEmail: email,
    studentName: name,
    ticketId,
    college,
    idCardBuffer,
  });

  console.log(`✅ Full pipeline complete for ${name} (${ticketId})\n`);
}

// ==========================================
// ROUTE: POST /api/register
// ==========================================
// What it does:
//   1. Receives student form data (name, email, phone, college, roll_no)
//   2. Creates a Razorpay Order (server-side, so the amount can't be tampered with)
//   3. Returns the order_id to the frontend to open the Razorpay checkout popup
//
// Why server-side order creation matters:
//   Without this, a student could open browser DevTools and change the amount
//   from ₹1000 to ₹1. With server-side orders, Razorpay enforces the exact
//   amount we set here.
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, college, roll_no } = req.body;

    // Validate all required fields
    if (!name || !email || !phone || !college || !roll_no) {
      return res.status(400).json({
        success: false,
        error: "All student fields are required (name, email, phone, college, roll_no)",
      });
    }

    // Create Razorpay Order
    // Amount is in PAISE (₹1000 = 100000 paise)
    const orderOptions = {
      amount: 100000,
      currency: "INR",
      receipt: `mm26_${Date.now()}`,
      notes: {
        student_name: name,
        student_email: email,
        student_phone: phone,
        college_name: college,
        roll_no: roll_no,
        fest: "MohanaMantra 2K26",
      },
    };

    const order = await razorpayInstance.orders.create(orderOptions);

    console.log(`📋 Order created: ${order.id} for ${name} (${college})`);

    // Return order details to the frontend
    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Order Creation Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create payment order. Please try again.",
    });
  }
});

// ==========================================
// ROUTE: POST /api/payment-webhook
// ==========================================
// What it does:
//   1. Receives async payment notifications from Razorpay
//   2. Verifies the request is genuinely from Razorpay using HMAC-SHA256
//   3. On successful payment: saves student record to Firestore with status "Paid"
//   4. Generates a unique Ticket ID and secure verification token
//
// How HMAC verification works (in plain English):
//   Razorpay sends a "signature" header with every webhook.
//   We take the raw body bytes + our secret key, run them through the SHA-256
//   hash algorithm, and check if our result matches Razorpay's signature.
//   If they match → the request is genuine.
//   If they don't → someone is trying to fake a payment notification.
app.post("/api/payment-webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // --- STEP A: Verify the signature ---
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    console.warn("⚠️  Webhook signature mismatch — possible spoofing attempt!");
    return res.status(400).json({ error: "Invalid signature" });
  }

  console.log("✅ Webhook signature verified — request is from Razorpay");

  // --- STEP B: Check the event type ---
  const event = req.body.event;

  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity = req.body.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    try {
      // Fetch original order to get the student's details from the notes
      const orderDetails = await razorpayInstance.orders.fetch(orderId);
      const notes = orderDetails.notes;

      const name = notes.student_name;
      const email = notes.student_email;
      const phone = notes.student_phone;
      const college = notes.college_name;
      const rollNo = notes.roll_no;

      // Generate unique identifiers
      const ticketId = generateTicketId();
      const secureToken = crypto.randomBytes(16).toString("hex");

      // --- STEP C: Save to Firestore ---
      await db.collection("registrations").doc(ticketId).set({
        ticketId,
        name,
        email,
        phone,
        college,
        rollNo,
        orderId,
        paymentId,
        paymentStatus: "Paid",
        checkInStatus: "Not Checked In",
        checkedInAt: null,
        secureToken,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`🎉 Registration CONFIRMED & saved to Firestore!`);
      console.log(`   Ticket ID : ${ticketId}`);
      console.log(`   Student   : ${name} (${college})`);
      console.log(`   Payment   : ${paymentId}`);
      console.log(`   Token     : ${secureToken.substring(0, 8)}...`);

      // =====================================================
      // STEP 3: Trigger ID card generation + email (background)
      // =====================================================
      // We run this in the background so the webhook response is fast.
      // If this fails, the payment is still recorded in Firestore.
      generateIdCardAndSendEmail({
        ticketId, name, college, rollNo, email, secureToken,
      }).catch((err) => {
        console.error("❌ ID card/email pipeline error:", err.message);
      });
    } catch (dbError) {
      console.error("❌ Firestore save error:", dbError);
      // Still return 200 to Razorpay — we don't want them to retry
      // and create duplicate records. We'll handle failures via logs.
    }
  } else {
    console.log(`ℹ️  Received webhook event: ${event} (ignored)`);
  }

  // ALWAYS return 200 OK to Razorpay, even on errors.
  // If we return an error, Razorpay will retry the webhook up to 24 hours,
  // which could create duplicate records in our database.
  res.status(200).json({ status: "ok" });
});

// ==========================================
// ROUTE: GET /api/health
// ==========================================
// Simple health check to verify the server is running
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "MohanaMantra 2K26 Backend",
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🚀 MohanaMantra 2K26 Backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Register:     POST http://localhost:${PORT}/api/register`);
  console.log(`   Webhook:      POST http://localhost:${PORT}/api/payment-webhook\n`);
});
