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
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
const { generateIdCard } = require("./services/idcard");
const { generateQRCode } = require("./services/qr");
const { sendIdCardEmail, isEmailConfigured } = require("./services/email");
const { createRegistrationService, RegistrationError, isConfiguredSecret, REGISTRATION_AMOUNT, REGISTRATION_CURRENCY } = require("./services/registration");
const { paymentEnvironment, recordMatchesMode } = require("./services/paymentEnvironment");
const { SESSION_NAMES, normalizeCheckInSessions } = require("./services/checkInSessions");
const environment = paymentEnvironment(process.env);

// ==========================================
// 1. FIREBASE ADMIN INITIALIZATION
// ==========================================
// Download your serviceAccountKey.json from:
//   Firebase Console → Project Settings → Service Accounts → Generate New Private Key
// Place it in the server/ directory.

const { cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

let serviceAccount = null;
const keyPath = path.join(__dirname, "serviceAccountKey.json");
const renderSecretPath = "/etc/secrets/serviceAccountKey.json";

if (fs.existsSync(keyPath)) {
  serviceAccount = require("./serviceAccountKey.json");
} else if (fs.existsSync(renderSecretPath)) {
  try {
    serviceAccount = JSON.parse(fs.readFileSync(renderSecretPath, "utf8"));
  } catch (err) {
    console.error("❌ Render service-account secret file is not valid JSON.");
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
  }
}

let db = null;

if (serviceAccount) {
  admin.initializeApp({
    credential: cert(serviceAccount),
  });
  db = getFirestore();
  console.log(`✅ Firebase Admin initialized for Firestore (${serviceAccount.project_id})`);
} else {
  console.error("⚠️ Firebase Admin NOT initialized — service account missing.");
}

// ==========================================
// 2. EXPRESS APP SETUP
// ==========================================
const app = express();

// Security headers
app.use(helmet());

// CORS — allow only verified frontend origins (localhost, project Vercel domains, and festival domain)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://mm-template.vercel.app",
  "https://mohanamantra.com",
  "https://www.mohanamantra.com",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl, webhooks)
      if (!origin) return callback(null, true);

      // Verify origin against allowlist or legitimate project preview deployments
      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/mm-template(-[a-z0-9-]+)?\.vercel\.app$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS policy.`), false);
      }
    },
    methods: ["GET", "POST"],
  })
);

// ==========================================
// RATE LIMITING (DOS & BRUTE FORCE DEFENSE)
// ==========================================

// Global rate limiter across all endpoints
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests from this IP. Please try again later." },
});
const staffPaths = new Set(["/api/gatekeeper/verify", "/api/gatekeeper/checkin"]);
app.use((req, res, next) => req.path === "/api/payment-webhook" || staffPaths.has(req.path)
  ? next() : generalLimiter(req, res, next));

// Strict brute-force limiter applies to staff login, not every entry scan.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login/verification attempts. Please wait 15 minutes." },
});

// Authenticated gates can share one event Wi-Fi address. A public-form or login
// limit must not stop that queue after only a handful of verified admissions.
const staffLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many gate requests. Please try again shortly." },
});

// Rate limiter for Razorpay registration order creation
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 25, // max 25 orders created per IP per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many registration attempts. Please wait a few minutes before trying again." },
});

// JSON body parser with RAW BODY preservation
// Why? Razorpay webhook verification needs the EXACT raw bytes of the request
// body to compute the HMAC signature. If we parse it to JSON first, the
// signature won't match because JSON.stringify() doesn't guarantee the same
// byte order as the original payload.
app.use(
  express.json({
    limit: "64kb",
    verify: (req, _res, buf) => {
      req.rawBody = Buffer.from(buf);
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
if (process.env.RAZORPAY_KEY_ID && isConfiguredSecret(process.env.RAZORPAY_KEY_SECRET)) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("✅ Razorpay client initialized");
  } catch (err) {
    console.warn("⚠️ Razorpay client initialization warning:", err.message);
  }
} else {
  console.log("ℹ️ Razorpay payment credentials are missing or placeholders; checkout is unavailable.");
}

// ==========================================
// 4. HELPER — Generate Ticket ID
// ==========================================
// Format: MM26-A3F1B2 (prefix + 6 random hex chars, uppercase)
// This gives us 16 million unique combinations — more than enough for a college fest.
function generateTicketId(mode = environment.mode) {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${mode === "test" ? "MM26-TEST-" : "MM26-"}${randomHex}`;
}

// Timing-safe string comparison to eliminate side-channel timing attacks
function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// ==========================================
// 5. PIPELINE — Generate ID Card + Send Email
// ==========================================
// This is the full pipeline that runs after a successful payment:
//   1. Generate the ID card image (with QR code, logo, student details)
//   2. Email it to the student as an attachment
//
// Payment confirmation tracks this delivery in Firestore. A failed delivery
// can be retried by a webhook or the student's confirmation request.
async function generateIdCardAndSendEmail({ ticketId, name, college, rollNo, email, secureToken, paymentMode }) {
  console.log(`\n🎨 Starting ID card & QR pipeline for ${name} (${ticketId})...`);

  // Step 1: Generate the ID card image
  const idCardBuffer = await generateIdCard({
    ticketId,
    name,
    college,
    rollNo,
    secureToken,
    paymentMode,
  });

  console.log(`✅ ID card image generated (${(idCardBuffer.length / 1024).toFixed(1)} KB)`);

  // Step 2: Generate standalone QR code image
  const qrBuffer = await generateQRCode(ticketId, name, secureToken);
  console.log(`✅ Standalone QR code generated (${(qrBuffer.length / 1024).toFixed(1)} KB)`);

  // Step 3: Send the email with ID card & QR code attached
  const delivery = await sendIdCardEmail({
    toEmail: email,
    studentName: name,
    ticketId,
    college,
    idCardBuffer,
    qrBuffer,
    paymentMode,
  });

  console.log(`✅ Full pipeline complete for ${name} (${ticketId})\n`);
  return delivery;
}

const registrationService = createRegistrationService({
  db,
  razorpay: razorpayInstance,
  config: process.env,
  serverTimestamp: () => FieldValue.serverTimestamp(),
  sendTicketEmail: generateIdCardAndSendEmail,
  emailConfigured: isEmailConfigured,
  generateTicketId,
});

function registrationFailure(error, res) {
  if (error instanceof RegistrationError) {
    return res.status(error.status).json({ success: false, code: error.code, error: error.message });
  }
  console.error("Registration request failed:", error.code || error.name || "UnknownError");
  return res.status(503).json({ success: false, code: "REGISTRATION_UNAVAILABLE", error: "Registration confirmation is temporarily unavailable. Please try again shortly." });
}

app.get("/api/registration-status", (_req, res) => {
  res.set("Cache-Control", "no-store");
  const status = registrationService.configurationStatus();
  res.json({
    ready: status.ready,
    amount: REGISTRATION_AMOUNT,
    currency: REGISTRATION_CURRENCY,
    paymentMode: environment.mode,
    configuration: { payment: status.payment, database: status.database, webhook: status.webhook, tickets: status.tickets, email: status.email },
  });
});

// Create and persist an order before the browser can open checkout.
app.post("/api/register", registerLimiter, async (req, res) => {
  try {
    res.status(200).json(await registrationService.createOrder(req.body));
  } catch (error) {
    registrationFailure(error, res);
  }
});

const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Please wait a few minutes before checking payment again." },
});

// Verify the checkout proof, captured payment, and durable ticket independently.
app.post("/api/payment-verify", verificationLimiter, async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    const result = await registrationService.verifyCheckout(req.body);
    res.status(result.success ? 200 : 202).json(result);
  } catch (error) {
    registrationFailure(error, res);
  }
});

// Razorpay can redeliver notifications; the transaction issues one ticket per order.
app.post("/api/payment-webhook", async (req, res) => {
  try {
    await registrationService.processWebhook(req.rawBody, req.headers["x-razorpay-signature"], req.body);
    res.status(200).json({ status: "ok" });
  } catch (error) {
    registrationFailure(error, res);
  }
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
  const expectedKey = process.env.ADMIN_KEY;
  const expectedSecret = process.env.ADMIN_SECRET;
  if (!expectedKey || !expectedSecret) {
    console.error("❌ ADMIN_KEY / ADMIN_SECRET not configured on server.");
    return false;
  }
  const isKeyValid = timingSafeCompare(adminKey, expectedKey);
  const isSecretValid = timingSafeCompare(adminSecret, expectedSecret);
  return isKeyValid && isSecretValid;
}

// ROUTE: POST /api/gatekeeper/login
app.post("/api/gatekeeper/login", authLimiter, (req, res) => {
  const { adminKey, adminSecret } = req.body || {};
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
    paymentMode: environment.mode,
  });
});

// ROUTE: POST /api/gatekeeper/verify
app.post("/api/gatekeeper/verify", staffLimiter, async (req, res) => {
  try {
    const { token, ticketId, adminKey, adminSecret } = req.body || {};

    if (!isValidAdmin(adminKey, adminSecret)) {
      return res.status(401).json({ success: false, error: "Unauthorized admin credentials." });
    }

    let targetTicketId = ticketId;
    let decodedTicket;

    // If token is provided, verify JWT signature
    if (token) {
     try {
    const jwt = require("jsonwebtoken");
    const jwtSecret = process.env.JWT_SECRET;
    if (!isConfiguredSecret(jwtSecret, 32)) {
    console.error("❌ JWT_SECRET not configured on server — cannot verify QR token.");
    return res.status(500).json({ success: false, error: "QR verification is not configured on this server." });
    }
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    if ((decoded.mode || "live") !== environment.mode) {
      return res.status(400).json({ success: false, error: "This QR pass belongs to a different payment environment." });
    }
    decodedTicket = decoded;
    targetTicketId = decoded.tid;
    } catch (jwtErr) {
    return res.status(400).json({ success: false, error: "Invalid or forged QR token signature." });
    }
    }

    if (typeof targetTicketId !== "string" || !new RegExp(`^${environment.ticketPrefix}[A-F0-9]{6}$`).test(targetTicketId)) {
      return res.status(400).json({ success: false, error: "Enter a valid ticket ID for this payment environment." });
    }

    if (!db) {
      return res.status(503).json({ success: false, error: "Firestore database not connected." });
    }

    const docRef = db.collection(environment.registrationsCollection).doc(targetTicketId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: `No registration found for Ticket ID: ${targetTicketId}` });
    }

    const student = docSnap.data();
    if (student.ticketId !== targetTicketId || !recordMatchesMode(student, environment.mode) || student.paymentStatus !== "Paid") {
      return res.status(400).json({ success: false, error: "This pass does not have a confirmed payment in this environment." });
    }
    if (decodedTicket && !timingSafeCompare(decodedTicket.stk, student.secureToken)) {
      return res.status(400).json({ success: false, error: "This QR code does not match the issued pass." });
    }

    const checkInSessions = normalizeCheckInSessions(student.checkInSessions);

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
        paymentMode: environment.mode,
        checkInStatus: student.checkInStatus || "Not Checked In",
        checkedInAt: student.checkedInAt ? student.checkedInAt.toDate?.() || student.checkedInAt : null,
        checkInSessions,
      },
    });
  } catch (error) {
    console.error("❌ Gatekeeper verify error:", error.code || error.name);
    return res.status(503).json({ success: false, error: "Ticket verification is temporarily unavailable. Please try again." });
  }
});

// ROUTE: POST /api/gatekeeper/checkin
app.post("/api/gatekeeper/checkin", staffLimiter, async (req, res) => {
  try {
    const { ticketId, sessionKey = "day1_am", adminKey, adminSecret } = req.body || {};

    if (!isValidAdmin(adminKey, adminSecret)) {
      return res.status(401).json({ success: false, error: "Unauthorized admin credentials." });
    }

    if (typeof ticketId !== "string" || !new RegExp(`^${environment.ticketPrefix}[A-F0-9]{6}$`).test(ticketId)) {
      return res.status(400).json({ success: false, error: "Ticket ID is required for check-in." });
    }
    if (typeof sessionKey !== "string" || !Object.hasOwn(SESSION_NAMES, sessionKey)) {
      return res.status(400).json({ success: false, error: "Select a valid event check-in session." });
    }

    if (!db) return res.status(503).json({ success: false, error: "Firestore database not connected." });
    const docRef = db.collection(environment.registrationsCollection).doc(ticketId);
    const sessionName = SESSION_NAMES[sessionKey];
    const result = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists) throw new RegistrationError(404, "TICKET_NOT_FOUND", "Ticket not found.");
      const student = snapshot.data();
      if (student.ticketId !== ticketId || !recordMatchesMode(student, environment.mode) || student.paymentStatus !== "Paid") {
        throw new RegistrationError(400, "PAYMENT_INCOMPLETE", "This pass does not have a confirmed payment in this environment.");
      }
      const sessions = normalizeCheckInSessions(student.checkInSessions);
      const currentSession = sessions[sessionKey] || { checkedIn: false, timestamp: null };
      if (currentSession.checkedIn) {
        const error = new RegistrationError(400, "ALREADY_CHECKED_IN", `Student is already checked in for ${sessionName}!`);
        error.checkedInAt = currentSession.timestamp;
        error.checkInSessions = sessions;
        error.sessionKey = sessionKey;
        throw error;
      }
      const nowIso = new Date().toISOString();
      const updatedSessions = { ...sessions, [sessionKey]: { checkedIn: true, timestamp: nowIso, gatekeeper: adminKey } };
      transaction.update(docRef, { checkInSessions: updatedSessions, checkInStatus: "Checked In", checkedInAt: FieldValue.serverTimestamp() });
      return { name: student.name, nowIso, updatedSessions };
    });

    console.log(`🎟️ Gate Check-in SUCCESS for ${result.name} (${ticketId}) - Session: ${sessionName}`);

    return res.status(200).json({
      success: true,
      message: `Successfully checked in ${result.name} for ${sessionName}`,
      ticketId,
      sessionKey,
      checkedInAt: result.nowIso,
      checkInSessions: result.updatedSessions,
    });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return res.status(error.status).json({ success: false, code: error.code, error: error.message,
        ...(error.code === "ALREADY_CHECKED_IN" ? { checkedInAt: error.checkedInAt, checkInSessions: error.checkInSessions, sessionKey: error.sessionKey } : {}) });
    }
    console.error("❌ Gatekeeper check-in error:", error.code || error.name);
    return res.status(503).json({ success: false, error: "Check-in is temporarily unavailable. Please try again." });
  }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
  console.log(`\n🚀 MohanaMantra 2K26 Backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Register:     POST http://localhost:${PORT}/api/register`);
  console.log(`   Webhook:      POST http://localhost:${PORT}/api/payment-webhook\n`);
  console.log(`   Payment mode: ${environment.mode}; records: ${environment.registrationsCollection}`);
});
