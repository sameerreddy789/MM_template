// Verify the private local test configuration without logging credentials or
// student data. Authentication only: this never pays or sends a test email.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const dotenv = require("dotenv");
const config = dotenv.parse(fs.readFileSync(path.join(__dirname, ".env.payment-test")));
const { initializeApp, cert, deleteApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

if (config.PAYMENT_MODE !== "test" || !/^rzp_test_/.test(config.RAZORPAY_KEY_ID || "")) {
  throw new Error("This diagnostic only permits the separate test configuration.");
}
if (process.env.FIRESTORE_EMULATOR_HOST) {
  throw new Error("This command checks the cloud test database. Use test-registration-firestore.js for emulator checks.");
}
Object.assign(process.env, config);
const { verifyEmailTransport } = require("./services/email");
const safeFailure = error => ({ ok: false, code: String(error.code || error.cause?.code || error.name || "unknown"),
  ...(error.responseCode ? { smtpResponseCode: error.responseCode } : {}) });

async function razorpayCheck() {
  const response = await fetch("https://api.razorpay.com/v1/orders?count=1", {
    headers: { Authorization: "Basic " + Buffer.from(config.RAZORPAY_KEY_ID + ":" + config.RAZORPAY_KEY_SECRET).toString("base64") },
    signal: AbortSignal.timeout(20000),
  });
  return { ok: response.ok, httpStatus: response.status, mode: "test" };
}
async function mailCheck() {
  await verifyEmailTransport();
  return { ok: true, authenticated: true, emailsSent: 0 };
}
async function firestoreCheck() {
  const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));
  const app = initializeApp({ credential: cert(serviceAccount) }, "payment-test-preflight");
  const db = getFirestore(app);
  db.settings({ preferRest: true });
  const ref = db.collection("testPaymentDiagnostics").doc(crypto.randomUUID());
  try {
    await ref.create({ mode: "test", diagnostic: true, createdAt: FieldValue.serverTimestamp() });
    const snapshot = await ref.get();
    if (!snapshot.exists || snapshot.data().mode !== "test") throw new Error("Diagnostic read did not match");
    await db.runTransaction(async tx => { const read = await tx.get(ref); if (!read.exists) throw new Error("Diagnostic missing"); tx.update(ref, { transactionChecked: true }); });
    return { ok: true, cloudWrite: true, cloudRead: true, transaction: true };
  } finally { await ref.delete().catch(() => {}); await db.terminate(); await deleteApp(app); }
}

async function run() {
  const names = ["razorpay", "gmail", "firestore"];
  const checks = [razorpayCheck(), mailCheck(), firestoreCheck()];
  const results = await Promise.allSettled(checks.map((check, index) => Promise.race([
    check, new Promise((_, reject) => setTimeout(() => { const error = new Error("Diagnostic timeout"); error.code = "TIMEOUT"; reject(error); }, 25000)),
  ]).then(result => { console.log(JSON.stringify({ check: names[index], ...result })); return result; },
    error => { console.log(JSON.stringify({ check: names[index], ...safeFailure(error) })); throw error; })));
  const summary = Object.fromEntries(results.map((result, i) => [names[i], result.status === "fulfilled" ? result.value : safeFailure(result.reason)]));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(Object.values(summary).some(result => !result.ok) ? 1 : 0);
}
run().catch(error => { console.error(JSON.stringify(safeFailure(error))); process.exitCode = 1; });
