// ==========================================
// MohanaMantra 2K26 Ã¢â‚¬â€ Backend Server
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
const { availableGatekeeperModes, gatekeeperEnvironment } = require("./services/gatekeeperEnvironment");
const { authenticateStaffRequest, isValidAdmin, issueStaffSession, timingSafeCompare } = require("./services/gatekeeperAuth");
const environment = paymentEnvironment(process.env);

// ==========================================
// 1. FIREBASE ADMIN INITIALIZATION
// ==========================================
// Download your serviceAccountKey.json from:
//   Firebase Console Ã¢â€ â€™ Project Settings Ã¢â€ â€™ Service Accounts Ã¢â€ â€™ Generate New Private Key
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
    console.error("Ã¢ÂÅ’ Render service-account secret file is not valid JSON.");
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (err) {
    console.error("Ã¢ÂÅ’ FIREBASE_SERVICE_ACCOUNT is not valid JSON.");
  }
}

let db = null;

if (serviceAccount) {
  admin.initializeApp({
    credential: cert(serviceAccount),
  });
  db = getFirestore();
  console.log(`Ã¢Å“â€¦ Firebase Admin initialized for Firestore (${serviceAccount.project_id})`);
} else {
  console.error("Ã¢Å¡Â Ã¯Â¸Â Firebase Admin NOT initialized Ã¢â‚¬â€ service account missing.");
}

// ==========================================
// 2. EXPRESS APP SETUP
// ==========================================
const app = express();
// Render terminates TLS and forwards the client address through one trusted
// application proxy. Direct local servers must ignore spoofed forwarding headers.
app.set("trust proxy", process.env.RENDER === "true" ? 1 : false);
app.disable("x-powered-by");

// Security headers
app.use(helmet({
  frameguard: { action: "deny" },
  contentSecurityPolicy: { directives: { frameAncestors: ["'none'"] } },
}));
app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

// CORS Ã¢â‚¬â€ allow only verified frontend origins (localhost, project Vercel domains, and festival domain)
const allowedOrigins = [
  ...(process.env.NODE_ENV === "production" ? [] : ["http://localhost:5173", "http://localhost:3000"]),
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

      const isAllowed = allowedOrigins.includes(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        const error = new Error("This browser origin is not allowed.");
        error.code = "ORIGIN_NOT_ALLOWED";
        callback(error, false);
      }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ==========================================
// RATE LIMITING (DOS & BRUTE FORCE DEFENSE)
// ==========================================

// Rate limiter for public API traffic
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // max 200 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests from this IP. Please try again later." },
});
const staffPaths = new Set(["/api/gatekeeper/login", "/api/gatekeeper/verify", "/api/gatekeeper/checkin"]);
app.use((req, res, next) => {
  // Liveness probes must stay available when public traffic exhausts its budget.
  const healthProbe = req.path === "/api/health" && (req.method === "GET" || req.method === "HEAD");
  return healthProbe || req.path === "/api/payment-webhook" || staffPaths.has(req.path)
    ? next() : generalLimiter(req, res, next);
});

// The same failed-authentication budget protects login and every staff endpoint.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many login/verification attempts. Please wait 15 minutes." },
});

function requireGatekeeperAdmin(req, res, next) {
  const adminKey = req.route?.path === "/api/gatekeeper/login"
    ? (isValidAdmin(process.env, req.body?.adminKey, req.body?.adminSecret) ? process.env.ADMIN_KEY : null)
    : authenticateStaffRequest(process.env, req);
  if (adminKey) {
    req.gatekeeperAdminKey = adminKey;
    return next();
  }
  // Valid staff can still sign in and scan on shared Wi-Fi even when someone
  // else exhausts that address's failed-login budget.
  return authLimiter(req, res, () => res.status(401).json({
    success: false, error: "Invalid admin credentials or expired staff session. Sign in again.",
  }));
}

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
      if (req.path.toLowerCase() === "/api/payment-webhook") req.rawBody = Buffer.from(buf);
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
    console.log("Ã¢Å“â€¦ Razorpay client initialized");
  } catch (err) {
    console.warn("Ã¢Å¡Â Ã¯Â¸Â Razorpay client initialization warning:", err.message);
  }
} else {
  console.log("Ã¢â€žÂ¹Ã¯Â¸Â Razorpay payment credentials are missing or placeholders; checkout is unavailable.");
}

// ==========================================
// 4. HELPER Ã¢â‚¬â€ Generate Ticket ID
// ==========================================
// Format: MM26-A3F1B2 (prefix + 6 random hex chars, uppercase)
// This gives us 16 million unique combinations Ã¢â‚¬â€ more than enough for a college fest.
function generateTicketId(mode = environment.mode) {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${mode === "test" ? "MM26-TEST-" : "MM26-"}${randomHex}`;
}

// ==========================================
// 5. PIPELINE Ã¢â‚¬â€ Generate ID Card + Send Email
// ==========================================
// This is the full pipeline that runs after a successful payment:
//   1. Generate the ID card image (with QR code, logo, student details)
//   2. Email it to the student as an attachment
//
// Payment confirmation tracks this delivery in Firestore. A failed delivery
// can be retried by a webhook or the student's confirmation request.
async function generateIdCardAndSendEmail({ ticketId, name, college, rollNo, email, secureToken, paymentMode }) {
  console.log(`\nÃ°Å¸Å½Â¨ Starting ID card & QR pipeline for ticket ${ticketId}...`);

  // Step 1: Generate the ID card image
  const idCardBuffer = await generateIdCard({
    ticketId,
    name,
    college,
    rollNo,
    secureToken,
    paymentMode,
  });

  console.log(`Ã¢Å“â€¦ ID card image generated (${(idCardBuffer.length / 1024).toFixed(1)} KB)`);

  // Step 2: Generate standalone QR code image
  const qrBuffer = await generateQRCode(ticketId, name, secureToken);
  console.log(`Ã¢Å“â€¦ Standalone QR code generated (${(qrBuffer.length / 1024).toFixed(1)} KB)`);

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

  console.log(`Ã¢Å“â€¦ Full pipeline complete for ticket ${ticketId}\n`);
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
    registrationsOpen: status.registrationsOpen,
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
    await registrationService.processWebhook(
      req.rawBody, req.headers["x-razorpay-signature"], req.body, req.headers["x-razorpay-event-id"],
    );
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
    message: "Ã°Å¸Å¡â‚¬ MohanaMantra 2K26 Backend Server is Live & Healthy!",
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

// ROUTE: POST /api/gatekeeper/login
app.post("/api/gatekeeper/login", requireGatekeeperAdmin, (req, res) => {
  res.set("Cache-Control", "no-store");
  const { paymentMode } = req.body || {};

  try {
    const scope = gatekeeperEnvironment(process.env, paymentMode);
    return res.status(200).json({
      success: true,
      message: "Admin authentication successful",
      adminKey: req.gatekeeperAdminKey,
      ...issueStaffSession(process.env),
      paymentMode: scope.mode,
      availableModes: availableGatekeeperModes(process.env),
    });
  } catch (error) { registrationFailure(error, res); }
});

// ROUTE: POST /api/gatekeeper/verify
app.post("/api/gatekeeper/verify", requireGatekeeperAdmin, staffLimiter, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const { token, ticketId, paymentMode } = req.body || {};
    const scope = gatekeeperEnvironment(process.env, paymentMode);

    let targetTicketId = ticketId;
    let decodedTicket;

    // If token is provided, verify JWT signature
    if (token) {
     try {
    const jwt = require("jsonwebtoken");
    const jwtSecret = scope.jwtSecret;
    if (!isConfiguredSecret(jwtSecret, 32)) {
    console.error("Ã¢ÂÅ’ JWT_SECRET not configured on server Ã¢â‚¬â€ cannot verify QR token.");
    return res.status(500).json({ success: false, error: "QR verification is not configured on this server." });
    }
    const decoded = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
    if ((decoded.mode || "live") !== scope.mode) {
      return res.status(400).json({ success: false, error: "This QR pass belongs to a different payment environment." });
    }
    decodedTicket = decoded;
    targetTicketId = decoded.tid;
    } catch (jwtErr) {
    return res.status(400).json({ success: false, error: "Invalid or forged QR token signature." });
    }
    }

    if (typeof targetTicketId !== "string" || !new RegExp(`^${scope.ticketPrefix}[A-F0-9]{6}$`).test(targetTicketId)) {
      return res.status(400).json({ success: false, error: "Enter a valid ticket ID for this payment environment." });
    }

    if (!db) {
      return res.status(503).json({ success: false, error: "Firestore database not connected." });
    }

    const docRef = db.collection(scope.registrationsCollection).doc(targetTicketId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ success: false, error: `No registration found for Ticket ID: ${targetTicketId}` });
    }

    const student = docSnap.data();
    if (student.ticketId !== targetTicketId || !recordMatchesMode(student, scope.mode) || student.paymentStatus !== "Paid") {
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
        paymentMode: scope.mode,
        checkInStatus: student.checkInStatus || "Not Checked In",
        checkedInAt: student.checkedInAt ? student.checkedInAt.toDate?.() || student.checkedInAt : null,
        checkInSessions,
      },
    });
  } catch (error) {
    if (error instanceof RegistrationError) return registrationFailure(error, res);
    console.error("Ã¢ÂÅ’ Gatekeeper verify error:", error.code || error.name);
    return res.status(503).json({ success: false, error: "Ticket verification is temporarily unavailable. Please try again." });
  }
});

// ROUTE: POST /api/gatekeeper/checkin
app.post("/api/gatekeeper/checkin", requireGatekeeperAdmin, staffLimiter, async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    const { ticketId, sessionKey = "day1_am", paymentMode } = req.body || {};
    const adminKey = req.gatekeeperAdminKey;
    const scope = gatekeeperEnvironment(process.env, paymentMode);

    if (typeof ticketId !== "string" || !new RegExp(`^${scope.ticketPrefix}[A-F0-9]{6}$`).test(ticketId)) {
      return res.status(400).json({ success: false, error: "Ticket ID is required for check-in." });
    }
    if (typeof sessionKey !== "string" || !Object.hasOwn(SESSION_NAMES, sessionKey)) {
      return res.status(400).json({ success: false, error: "Select a valid event check-in session." });
    }

    if (!db) return res.status(503).json({ success: false, error: "Firestore database not connected." });
    const docRef = db.collection(scope.registrationsCollection).doc(ticketId);
    const sessionName = SESSION_NAMES[sessionKey];
    const result = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(docRef);
      if (!snapshot.exists) throw new RegistrationError(404, "TICKET_NOT_FOUND", "Ticket not found.");
      const student = snapshot.data();
      if (student.ticketId !== ticketId || !recordMatchesMode(student, scope.mode) || student.paymentStatus !== "Paid") {
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

    console.log(`Ã°Å¸Å½Å¸Ã¯Â¸Â Gate Check-in SUCCESS for ticket ${ticketId} - Session: ${sessionName}`);

    return res.status(200).json({
      success: true,
      message: `Successfully checked in ${result.name} for ${sessionName}`,
      ticketId,
      paymentMode: scope.mode,
      sessionKey,
      checkedInAt: result.nowIso,
      checkInSessions: result.updatedSessions,
    });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return res.status(error.status).json({ success: false, code: error.code, error: error.message,
        ...(error.code === "ALREADY_CHECKED_IN" ? { checkedInAt: error.checkedInAt, checkInSessions: error.checkInSessions, sessionKey: error.sessionKey } : {}) });
    }
    console.error("Ã¢ÂÅ’ Gatekeeper check-in error:", error.code || error.name);
    return res.status(503).json({ success: false, error: "Check-in is temporarily unavailable. Please try again." });
  }
});

// ==========================================
// REGISTRATION CHECK (authorized read-only list)
// ==========================================
// Exposes only name, email, and payment status for the active payment mode's
// registrations. Guarded by RCHECK_ID / RCHECK_PASSWORD set in the backend env.
const rcheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts. Please wait a few minutes." },
});

function isValidRcheck(config, id, password) {
  const expectedId = config.RCHECK_ID;
  const expectedPassword = config.RCHECK_PASSWORD;
  if (!expectedId || !expectedPassword) {
    console.error("RCHECK_ID / RCHECK_PASSWORD not configured on server.");
    return false;
  }
  if (typeof id !== "string" || typeof password !== "string") return false;
  return timingSafeCompare(id, expectedId) && timingSafeCompare(password, expectedPassword);
}

app.post("/api/rcheck/registrations", rcheckLimiter, async (req, res) => {
  res.set("Cache-Control", "no-store");
  const { id, password } = req.body || {};
  if (!isValidRcheck(process.env, id, password)) {
    return res.status(401).json({ success: false, error: "Invalid ID or password." });
  }
  if (!db) return res.status(503).json({ success: false, error: "Database not connected." });

  function toIso(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") { try { return value.toDate().toISOString(); } catch { return null; } }
    if (value._seconds !== undefined) return new Date(value._seconds * 1000).toISOString();
    if (value instanceof Date) return value.toISOString();
    return typeof value === "string" ? value : null;
  }

  try {
    // Every order that was ever created lives in the orders collection, with a
    // nested student object and a paymentStatus (Pending/Paid). Paid tickets also
    // exist in the registrations collection with flat fields. Merge both so the
    // viewer shows the full funnel, not only the paid tickets.
    const [ordersSnap, ticketsSnap] = await Promise.all([
      db.collection(environment.ordersCollection).get(),
      db.collection(environment.registrationsCollection).get(),
    ]);

    const rows = new Map(); // keyed by orderId (fallback: ticketId/email)

    ordersSnap.docs.forEach((doc) => {
      const order = doc.data();
      if (order.paymentMode !== undefined && order.paymentMode !== environment.mode) return;
      const student = order.student || {};
      rows.set(doc.id, {
        name: student.name || order.name || "",
        email: student.email || order.email || "",
        phone: student.phone || order.phone || "",
        college: student.college || order.college || "",
        paymentStatus: order.paymentStatus || "Pending",
        ticketId: order.ticketId || "",
        createdAt: toIso(order.createdAt),
      });
    });

    // Overlay paid tickets: upgrade status and fill details, add any not in orders.
    ticketsSnap.docs.forEach((doc) => {
      const t = doc.data();
      if (!recordMatchesMode(t, environment.mode)) return;
      const key = t.orderId || doc.id;
      const existing = rows.get(key);
      const merged = {
        name: t.name || existing?.name || "",
        email: t.email || existing?.email || "",
        phone: t.phone || existing?.phone || "",
        college: t.college || existing?.college || "",
        paymentStatus: t.paymentStatus || "Paid",
        ticketId: t.ticketId || doc.id,
        createdAt: toIso(t.createdAt) || existing?.createdAt || null,
      };
      rows.set(key, merged);
    });

    const registrations = [...rows.values()].sort((a, b) => {
      if (a.createdAt && b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      if (a.createdAt) return -1;
      if (b.createdAt) return 1;
      return 0;
    });

    return res.status(200).json({ success: true, count: registrations.length, paymentMode: environment.mode, registrations });
  } catch (error) {
    console.error("rcheck registrations error:", error.code || error.name);
    return res.status(503).json({ success: false, error: "Could not read registrations. Please try again." });
  }
});
app.use((_req, res) => res.status(404).json({ success: false, error: "Endpoint not found." }));
app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.code === "ORIGIN_NOT_ALLOWED") {
    return res.status(403).json({ success: false, code: "ORIGIN_NOT_ALLOWED", error: "This browser origin is not allowed." });
  }
  if (error.type === "entity.too.large") {
    return res.status(413).json({ success: false, code: "PAYLOAD_TOO_LARGE", error: "The request is too large." });
  }
  if (error.status === 415) {
    return res.status(415).json({ success: false, error: "Unsupported request encoding." });
  }
  console.error("Request failed:", error.code || error.name || "UnknownError");
  return res.status(500).json({ success: false, error: "This request could not be completed." });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, process.env.HOST || "0.0.0.0", () => {
  console.log(`\nÃ°Å¸Å¡â‚¬ MohanaMantra 2K26 Backend running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Register:     POST http://localhost:${PORT}/api/register`);
  console.log(`   Webhook:      POST http://localhost:${PORT}/api/payment-webhook\n`);
  console.log(`   Payment mode: ${environment.mode}; records: ${environment.registrationsCollection}`);
});
