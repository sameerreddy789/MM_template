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
const { generateQRCode } = require("./services/qr");
const { sendIdCardEmail } = require("./services/email");
require("dotenv").config();

// ==========================================
// 1. FIREBASE ADMIN INITIALIZATION
// ==========================================
// Download your serviceAccountKey.json from:
//   Firebase Console → Project Settings → Service Accounts → Generate New Private Key
// Place it in the server/ directory.

const { cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const fs = require("fs");
const path = require("path");

let serviceAccount = null;
const keyPath = path.join(__dirname, "serviceAccountKey.json");
const renderSecretPath = "/etc/secrets/serviceAccountKey.json";

if (fs.existsSync(keyPath)) {
  serviceAccount = require("./serviceAccountKey.json");
} else if (fs.existsSync(renderSecretPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(renderSecretPath, "utf8"));
  } catch (err) {
    console.error("❌ Failed to parse Render secret file at /etc/secrets/serviceAccountKey.json:", err.message);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:", err.message);
  }
}

let db = null;

if (serviceAccount) {
  admin.initializeApp({
    credential: cert(serviceAccount),
  });
  db = getFirestore();
  console.log(`✅ Firebase Admin connected to Firestore (${serviceAccount.project_id})`);
} else {
  console.error("⚠️ Firebase Admin NOT initialized — service account missing.");
}

// ==========================================
// 2. EXPRESS APP SETUP
// ==========================================
const app = express();

// Security headers
app.use(helmet());

// CORS — allow frontend (localhost, Vercel, or custom domain) to talk to this backend
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, postman) or matching allowed domains
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app") || origin.includes("mohanamantra")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
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

// Handle malformed JSON body errors gracefully
app.use((err, _req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ success: false, error: "Invalid or malformed JSON payload." });
  }
  next(err);
});

// ==========================================
// 3. RAZORPAY INSTANCE
// ==========================================
let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
    });
    console.log("✅ Razorpay client initialized");
  } catch (err) {
    console.warn("⚠️ Razorpay client initialization warning:", err.message);
  }
} else {
  console.log("ℹ️  RAZORPAY_KEY_ID not set — direct client-side checkout mode active.");
}

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
  console.log(`\n🎨 Starting ID card & QR pipeline for ${name} (${ticketId})...`);

  // Step 1: Generate the ID card image
  const idCardBuffer = await generateIdCard({
    ticketId,
    name,
    college,
    rollNo,
    secureToken,
  });

  console.log(`✅ ID card image generated (${(idCardBuffer.length / 1024).toFixed(1)} KB)`);

  // Step 2: Generate standalone QR code image
  const qrBuffer = await generateQRCode(ticketId, name, secureToken);
  console.log(`✅ Standalone QR code generated (${(qrBuffer.length / 1024).toFixed(1)} KB)`);

  // Step 3: Send the email with ID card & QR code attached
  await sendIdCardEmail({
    toEmail: email,
    studentName: name,
    ticketId,
    college,
    idCardBuffer,
    qrBuffer,
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
    if (!razorpayInstance) {
      return res.status(400).json({
        success: false,
        error: "Razorpay keys not configured on server.",
      });
    }

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
        createdAt: FieldValue.serverTimestamp(),
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
// ROUTE: GET /
// ==========================================
app.get("/", (_req, res) => {
  res.status(200).json({
    message: "🚀 MohanaMantra 2K26 Backend Server is Live & Healthy!",
    health: "/api/health",
    status: "online",
  });
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
// GATEKEEPER API ENDPOINTS (ADMIN AUTHENTICATION)
// ==========================================

// Helper to validate Admin Key-Value Credentials
function isValidAdmin(adminKey, adminSecret) {
  const expectedKey = process.env.ADMIN_KEY || "admin_gatekeeper";
  const expectedSecret = process.env.ADMIN_SECRET || "MM26_Gatekeeper_Secret_99!";
  return adminKey === expectedKey && adminSecret === expectedSecret;
}

// ROUTE: POST /api/gatekeeper/login
app.post("/api/gatekeeper/login", (req, res) => {
  const { adminKey, adminSecret } = req.body;
  if (!adminKey || !adminSecret || !isValidAdmin(adminKey, adminSecret)) {
    return res.status(401).json({
      success: false,
      error: "Invalid Admin Key or Secret. Access denied.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Admin authentication successful",
    adminKey,
  });
});

// ROUTE: POST /api/gatekeeper/verify
app.post("/api/gatekeeper/verify", async (req, res) => {
  try {
    const { token, ticketId, adminKey, adminSecret } = req.body;

    if (!isValidAdmin(adminKey, adminSecret)) {
      return res.status(401).json({ success: false, error: "Unauthorized admin credentials." });
    }

    let targetTicketId = ticketId;

    // If token is provided, verify JWT signature
    if (token) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mohanamantra2k26_super_secret_jwt_key_change_me");
        targetTicketId = decoded.tid;
      } catch (jwtErr) {
        return res.status(400).json({ success: false, error: "Invalid or forged QR token signature." });
      }
    }

    if (!targetTicketId) {
      return res.status(400).json({ success: false, error: "Ticket ID or token required." });
    }

    if (!db) {
      return res.status(500).json({ success: false, error: "Firestore database not connected." });
    }

    const docRef = db.collection("registrations").doc(targetTicketId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: `No registration found for Ticket ID: ${targetTicketId}` });
    }

    const student = docSnap.data();

    const defaultSessions = {
      day1_am: { checkedIn: false, timestamp: null },
      day1_pm: { checkedIn: false, timestamp: null },
      day2_am: { checkedIn: false, timestamp: null },
      day2_pm: { checkedIn: false, timestamp: null },
    };

    const checkInSessions = student.checkInSessions || defaultSessions;

    return res.status(200).json({
      success: true,
      student: {
        ticketId: student.ticketId,
        name: student.name,
        college: student.college,
        rollNo: student.rollNo,
        email: student.email,
        phone: student.phone,
        paymentStatus: student.paymentStatus || "Paid",
        checkInStatus: student.checkInStatus || "Not Checked In",
        checkedInAt: student.checkedInAt ? student.checkedInAt.toDate?.() || student.checkedInAt : null,
        checkInSessions,
      },
    });
  } catch (error) {
    console.error("❌ Gatekeeper verify error:", error);
    return res.status(500).json({ success: false, error: "Failed to verify ticket." });
  }
});

const SESSION_NAMES = {
  day1_am: "Day 1 Morning",
  day1_pm: "Day 1 Evening",
  day2_am: "Day 2 Morning",
  day2_pm: "Day 2 Evening",
};

// ROUTE: POST /api/gatekeeper/checkin
app.post("/api/gatekeeper/checkin", async (req, res) => {
  try {
    const { ticketId, sessionKey = "day1_am", adminKey, adminSecret } = req.body;

    if (!isValidAdmin(adminKey, adminSecret)) {
      return res.status(401).json({ success: false, error: "Unauthorized admin credentials." });
    }

    if (!ticketId) {
      return res.status(400).json({ success: false, error: "Ticket ID is required for check-in." });
    }

    const docRef = db.collection("registrations").doc(ticketId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: "Ticket not found." });
    }

    const student = docSnap.data();

    const defaultSessions = {
      day1_am: { checkedIn: false, timestamp: null },
      day1_pm: { checkedIn: false, timestamp: null },
      day2_am: { checkedIn: false, timestamp: null },
      day2_pm: { checkedIn: false, timestamp: null },
    };

    const sessions = student.checkInSessions || defaultSessions;
    const currentSession = sessions[sessionKey] || { checkedIn: false, timestamp: null };
    const sessionName = SESSION_NAMES[sessionKey] || sessionKey;

    if (currentSession.checkedIn) {
      return res.status(400).json({
        success: false,
        error: `Student is already checked in for ${sessionName}!`,
        checkedInAt: currentSession.timestamp,
        sessionKey,
      });
    }

    const nowIso = new Date().toISOString();
    const updatedSessions = {
      ...sessions,
      [sessionKey]: {
        checkedIn: true,
        timestamp: nowIso,
        gatekeeper: adminKey,
      },
    };

    await docRef.update({
      checkInSessions: updatedSessions,
      checkInStatus: "Checked In",
      checkedInAt: FieldValue.serverTimestamp(),
    });

    console.log(`🎟️ Gate Check-in SUCCESS for ${student.name} (${ticketId}) - Session: ${sessionName}`);

    return res.status(200).json({
      success: true,
      message: `Successfully checked in ${student.name} for ${sessionName}`,
      ticketId,
      sessionKey,
      checkedInAt: nowIso,
      checkInSessions: updatedSessions,
    });
  } catch (error) {
    console.error("❌ Gatekeeper check-in error:", error);
    return res.status(500).json({ success: false, error: error.message || "Check-in failed." });
  }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 MohanaMantra 2K26 Backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Register:     POST http://localhost:${PORT}/api/register`);
  console.log(`   Webhook:      POST http://localhost:${PORT}/api/payment-webhook\n`);
});
