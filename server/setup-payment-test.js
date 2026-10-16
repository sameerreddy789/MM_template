// Import the private Razorpay dashboard export without logging either credential.
// This creates an ignored local environment and preserves the existing .env.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const dotenv = require("dotenv");

function parseCsv(text) {
  const rows = [];
  let row = [], value = "", quoted = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (char === "," || char === "\n" || char === "\r")) {
      row.push(value.trim()); value = "";
      if (char !== ",") {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (char === "\r" && text[i + 1] === "\n") i++;
      }
    } else value += char;
  }
  if (quoted) throw new Error("The credential CSV contains an incomplete quoted field.");
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function setup() {
  const inputPath = path.resolve(process.argv[2] || path.join(__dirname, "..", "rzp.csv"));
  const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  if (rows.length !== 2) throw new Error("Provide a CSV with one header and exactly one test credential pair.");
  const headers = rows[0].map(value => value.toLowerCase());
  const keyId = rows[1][headers.indexOf("key_id")];
  const keySecret = rows[1][headers.indexOf("key_secret")];
  if (!/^rzp_test_[A-Za-z0-9]+$/.test(keyId || "") ||
      !/^[A-Za-z0-9_-]{16,}$/.test(keySecret || "")) {
    throw new Error("The export must contain a usable Razorpay TEST key_id and key_secret. Live credentials are refused.");
  }
  const originalPath = path.join(__dirname, ".env");
  const testPath = path.join(__dirname, ".env.payment-test");
  const existing = fs.existsSync(testPath) ? dotenv.parse(fs.readFileSync(testPath)) : {};
  const original = fs.existsSync(originalPath) ? dotenv.parse(fs.readFileSync(originalPath)) : {};
  const secret = key => /^[a-f0-9]{64}$/.test(existing[key] || "")
    ? existing[key] : crypto.randomBytes(32).toString("hex");
  // Copy only settings required by this test. Never inherit a production JWT secret.
  const config = {
    NODE_ENV: "development", PAYMENT_MODE: "test", HOST: "127.0.0.1", PORT: "4000",
    FRONTEND_URL: "http://localhost:5173",
    RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret,
    RAZORPAY_WEBHOOK_SECRET: secret("RAZORPAY_WEBHOOK_SECRET"),
    JWT_SECRET: secret("JWT_SECRET"),
    TICKET_EMAIL_MODE: "inline",
    GMAIL_USER: original.GMAIL_USER || "",
    GMAIL_APP_PASSWORD: (original.GMAIL_APP_PASSWORD || "").replace(/\s/g, ""),
    FIREBASE_SERVICE_ACCOUNT: original.FIREBASE_SERVICE_ACCOUNT || "",
    ADMIN_KEY: "local-payment-test", ADMIN_SECRET: secret("ADMIN_SECRET"),
  };
  const encode = value => '"' + String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, "\\n") + '"';
  fs.writeFileSync(testPath,
    "# PRIVATE local test settings. Never commit or use these for live registration.\n" +
    Object.entries(config).map(([key, value]) => `${key}=${encode(value)}`).join("\n") + "\n",
    { mode: 0o600 });
  console.log("Prepared server/.env.payment-test with Razorpay Test Mode credentials.");
  console.log("Existing server/.env preserved. Test JWT, webhook, and staff secrets are separate.");
  console.log("Start with: npm --prefix server run dev:payment-test");
}

try { setup(); }
catch (error) {
  const safeMessage = error.code ? `Cannot read/write the private test configuration (${error.code}).` : error.message;
  console.error(safeMessage);
  process.exitCode = 1;
}
