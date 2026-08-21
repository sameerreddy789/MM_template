// ==========================================
// MohanaMantra 2K26 — Firebase Cloud Functions (v2)
// ==========================================
// Functions:
//   1. createRazorpayOrder (HTTPS) - Creates Razorpay Order for student registration
//   2. razorpayWebhook    (HTTPS) - Receives & verifies Razorpay payment webhooks, saves to Firestore
//   3. onRegistrationCreated (Firestore Trigger) - Generates ID card & sends confirmation email in background
//   4. api                 (Express App) - Unified HTTP endpoints (/api/register, /api/payment-webhook, /api/health)
// ==========================================

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { generateIdCard } = require("./services/idcard");
const { sendIdCardEmail } = require("./services/email");
require("dotenv").config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Initialize Razorpay
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "dummy_key_id",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_key_secret",
});

// Ticket ID Generator (e.g. MM26-A3F1B2)
function generateTicketId() {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MM26-${randomHex}`;
}

// ==========================================
// 1. EXPRESS APP SETUP FOR HTTP ENDPOINTS
// ==========================================
const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// Preserving raw body for Razorpay Webhook HMAC verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "MohanaMantra 2K26 Cloud Functions",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/register - Create Razorpay Order
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, phone, college, roll_no } = req.body;

    if (!name || !email || !phone || !college || !roll_no) {
      return res.status(400).json({
        success: false,
        error: "All fields are required (name, email, phone, college, roll_no)",
      });
    }

    const orderOptions = {
      amount: 100000, // ₹1000 in paise
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

    return res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Order Creation Error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create payment order.",
    });
  }
});

// POST /api/payment-webhook - Razorpay Webhook Handler
app.post("/api/payment-webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  if (secret && signature && req.rawBody) {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.rawBody)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.warn("⚠️ Webhook signature mismatch!");
      return res.status(400).json({ error: "Invalid signature" });
    }
  }

  const event = req.body.event;

  if (event === "payment.captured" || event === "order.paid") {
    const paymentEntity = req.body.payload.payment.entity;
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    try {
      const orderDetails = await razorpayInstance.orders.fetch(orderId);
      const notes = orderDetails.notes;

      const ticketId = generateTicketId();
      const secureToken = crypto.randomBytes(16).toString("hex");

      // Save registration to Firestore
      // This document creation automatically triggers `onRegistrationCreated` Cloud Function below!
      await db.collection("registrations").doc(ticketId).set({
        ticketId,
        name: notes.student_name,
        email: notes.student_email,
        phone: notes.student_phone,
        college: notes.college_name,
        rollNo: notes.roll_no,
        orderId,
        paymentId,
        paymentStatus: "Paid",
        checkInStatus: "Not Checked In",
        checkedInAt: null,
        secureToken,
        emailSent: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`🎉 Registration saved to Firestore: ${ticketId}`);
    } catch (dbError) {
      console.error("❌ Firestore save error:", dbError);
    }
  }

  // Always return 200 OK to Razorpay so it doesn't retry endlessly
  return res.status(200).json({ status: "ok" });
});

// ==========================================
// EXPORT 1: Unified Express API Function
// Endpoint: https://<region>-<project>.cloudfunctions.net/api
// ==========================================
exports.api = onRequest({ cors: true }, app);

// ==========================================
// EXPORT 2: Background Firestore Trigger
// Runs automatically whenever a new ticket registration document is saved in Firestore
// ==========================================
exports.onRegistrationCreated = onDocumentCreated(
  "registrations/{ticketId}",
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      console.log("No data associated with the event");
      return;
    }

    const data = snapshot.data();
    if (data.emailSent || data.paymentStatus !== "Paid") {
      console.log(`Skipping ID card/email pipeline for ${event.params.ticketId} (Already processed or unpaid)`);
      return;
    }

    console.log(`🎨 Background Processing: ID Card & Email for ${data.name} (${data.ticketId})`);

    try {
      // Step 1: Generate ID Card
      const idCardBuffer = await generateIdCard({
        ticketId: data.ticketId,
        name: data.name,
        college: data.college,
        rollNo: data.rollNo,
        secureToken: data.secureToken,
      });

      // Step 2: Send Email
      await sendIdCardEmail({
        toEmail: data.email,
        studentName: data.name,
        ticketId: data.ticketId,
        college: data.college,
        idCardBuffer,
      });

      // Step 3: Mark as processed in Firestore
      await snapshot.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Background pipeline complete for ${data.ticketId}`);
    } catch (err) {
      console.error(`❌ Background pipeline error for ${data.ticketId}:`, err);
    }
  }
);
