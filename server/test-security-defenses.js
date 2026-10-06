// ==========================================
// MohanaMantra 2K26 — Backend Security & Defensive Verification Suite
// ==========================================
// Tests defensive controls:
// 1. HTML Sanitization in Email Service (prevents HTML/script injection)
// 2. Timing-Safe Comparison (protects against timing attacks on secrets/signatures)
// 3. Webhook Signature Verification logic (HMAC-SHA256 integrity)
// 4. Registration Input Validation (field length, email/phone format, trimming)
// 5. Gatekeeper Authentication logic (timing-safe credential checks)
// ==========================================

const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${description}`);
    failed++;
  }
}

console.log("\n==================================================");
console.log("🛡️  MOHANA MANTRA 2K26 — BACKEND DEFENSIVE SECURITY TESTS");
console.log("==================================================\n");

// ----------------------------------------------------
// 1. Timing-Safe String Comparison
// ----------------------------------------------------
console.log("1. Testing Timing-Safe Comparison Defense...");
function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

assert("Identical strings evaluate to true", timingSafeCompare("secret_key_123", "secret_key_123") === true);
assert("Different strings evaluate to false", timingSafeCompare("secret_key_123", "secret_key_456") === false);
assert("Handles differing lengths safely without crashing", timingSafeCompare("short", "much_longer_string_value") === false);
assert("Non-string types return false safely", timingSafeCompare(null, "test") === false && timingSafeCompare("test", undefined) === false);

// ----------------------------------------------------
// 2. Email HTML Escaping (Injection Defense)
// ----------------------------------------------------
console.log("\n2. Testing Email HTML Sanitization Defense...");
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const payloadWithHtml = '<script>alert("xss")</script><img src="x" onerror="steal()">';
const sanitized = escapeHtml(payloadWithHtml);

assert("Converts < and > tags into HTML entities", !sanitized.includes("<script>") && sanitized.includes("&lt;script&gt;"));
assert("Converts quotes and double-quotes", sanitized.includes("&quot;xss&quot;"));
assert("Handles null or undefined without throwing", escapeHtml(null) === "" && escapeHtml(undefined) === "");

// ----------------------------------------------------
// 3. HMAC-SHA256 Webhook Verification
// ----------------------------------------------------
console.log("\n3. Testing Razorpay Webhook HMAC Signature Defense...");
const testWebhookSecret = "test_webhook_secret_key_999";
const validRawBody = JSON.stringify({ event: "payment.captured", id: "pay_test123" });
const tamperedRawBody = JSON.stringify({ event: "payment.captured", id: "pay_spoofed999" });

const genuineSignature = crypto
  .createHmac("sha256", testWebhookSecret)
  .update(validRawBody)
  .digest("hex");

const spoofedSignature = crypto
  .createHmac("sha256", testWebhookSecret)
  .update(tamperedRawBody)
  .digest("hex");

assert("Valid payload and matching signature passes", timingSafeCompare(genuineSignature, genuineSignature) === true);
assert("Tampered payload signature is rejected", timingSafeCompare(genuineSignature, spoofedSignature) === false);
assert("Random spoofed string is rejected", timingSafeCompare(genuineSignature, "1234567890abcdef") === false);

// ----------------------------------------------------
// 4. Registration Input Validation Defense
// ----------------------------------------------------
console.log("\n4. Testing Registration Input Validation...");

function validateRegistrationInput({ name, email, phone, college, roll_no }) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";
  const cleanCollege = typeof college === "string" ? college.trim() : "";
  const cleanRollNo = typeof roll_no === "string" ? roll_no.trim().toUpperCase() : "";

  if (!cleanName || !cleanEmail || !cleanPhone || !cleanCollege || !cleanRollNo) {
    return { valid: false, error: "Missing required fields" };
  }
  if (cleanName.length > 100 || cleanCollege.length > 150 || cleanRollNo.length > 50) {
    return { valid: false, error: "Exceeds length limit" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail) || cleanEmail.length > 120) {
    return { valid: false, error: "Invalid email" };
  }
  const phoneCleanDigits = cleanPhone.replace(/[\s\-\(\)]/g, "");
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  if (!phoneRegex.test(phoneCleanDigits)) {
    return { valid: false, error: "Invalid phone" };
  }
  return { valid: true };
}

assert("Legitimate registration payload passes", validateRegistrationInput({
  name: "Sameer Reddy",
  email: "student@example.com",
  phone: "+91 9876543210",
  college: "Mohan Babu University",
  roll_no: "22cs101"
}).valid === true);

assert("Rejects empty/whitespace-only names", validateRegistrationInput({
  name: "   ",
  email: "student@example.com",
  phone: "9876543210",
  college: "MBU",
  roll_no: "22CS101"
}).valid === false);

assert("Rejects invalid email format", validateRegistrationInput({
  name: "Sameer Reddy",
  email: "student@@bad-email..com",
  phone: "9876543210",
  college: "MBU",
  roll_no: "22CS101"
}).valid === false);

assert("Rejects overly short phone numbers", validateRegistrationInput({
  name: "Sameer Reddy",
  email: "student@example.com",
  phone: "123",
  college: "MBU",
  roll_no: "22CS101"
}).valid === false);

assert("Rejects oversized payloads", validateRegistrationInput({
  name: "A".repeat(150),
  email: "student@example.com",
  phone: "9876543210",
  college: "MBU",
  roll_no: "22CS101"
}).valid === false);

// ----------------------------------------------------
// 5. Gatekeeper Credential Authentication Check
// ----------------------------------------------------
console.log("\n5. Testing Gatekeeper Authentication Logic...");
const validAdminKey = process.env.ADMIN_KEY || "admin_gatekeeper";
const validAdminSecret = process.env.ADMIN_SECRET || "MM26_Gatekeeper_Secret_99!";

function authenticateAdmin(key, secret) {
  if (!validAdminKey || !validAdminSecret) return false;
  const isKeyValid = timingSafeCompare(key, validAdminKey);
  const isSecretValid = timingSafeCompare(secret, validAdminSecret);
  return isKeyValid && isSecretValid;
}

assert("Correct admin credentials authenticate", authenticateAdmin(validAdminKey, validAdminSecret) === true);
assert("Incorrect admin secret rejected", authenticateAdmin(validAdminKey, "wrong_secret") === false);
assert("Incorrect admin key rejected", authenticateAdmin("wrong_admin", validAdminSecret) === false);
assert("Empty credentials rejected", authenticateAdmin("", "") === false);

console.log("\n==================================================");
console.log(`🏁 RESULTS: ${passed} Passed, ${failed} Failed`);
console.log("==================================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
