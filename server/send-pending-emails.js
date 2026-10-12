// Run on the trusted local machine that can reach the official Google mailbox.
// This is not started by the web server and is not run by the isolated tests.
const fs = require("node:fs");
const path = require("node:path");
const { setTimeout: delay } = require("node:timers/promises");

async function run() {
  if (process.argv.includes("--help")) {
    console.log("Usage: node server/send-pending-emails.js [--once]");
    console.log("Sends queued paid entry passes using server/.env and the existing Gmail service.");
    console.log("Default: check the queue every 60 seconds. --once: process one batch and exit.");
    return;
  }
  require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });
  const { createRegistrationService, isConfiguredSecret } = require("./services/registration");
  const { sendIdCardEmail, isEmailConfigured } = require("./services/email");
  const { generateIdCard } = require("./services/idcard");
  const { generateQRCode } = require("./services/qr");
  const { sendPendingEntryPasses } = require("./services/emailQueue");
  const { initializeApp, cert, deleteApp } = require("firebase-admin/app");
  const { getFirestore, FieldValue } = require("firebase-admin/firestore");
  if (!isEmailConfigured(process.env) || !isConfiguredSecret(process.env.JWT_SECRET, 32)) {
    throw new Error("Configure the official Gmail sender, app password, and ticket-signing secret before starting the mail sender.");
  }
  let serviceAccount;
  try {
    const localKey = path.join(__dirname, "serviceAccountKey.json");
    serviceAccount = fs.existsSync(localKey)
      ? JSON.parse(fs.readFileSync(localKey, "utf8"))
      : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "null");
    if (!serviceAccount) throw new Error("Missing service account");
  } catch {
    throw new Error("The local Firebase service-account configuration is missing or invalid.");
  }
  const app = initializeApp({ credential: cert(serviceAccount) }, "entry-pass-mail-sender");
  const db = getFirestore(app);
  const service = createRegistrationService({
    db, razorpay: null,
    config: { ...process.env, TICKET_EMAIL_MODE: "inline" },
    serverTimestamp: () => FieldValue.serverTimestamp(),
    emailConfigured: isEmailConfigured,
    generateTicketId: () => { throw new Error("The mail sender cannot create tickets"); },
    sendTicketEmail: async record => {
      const idCardBuffer = await generateIdCard(record);
      const qrBuffer = await generateQRCode(record.ticketId, record.name, record.secureToken);
      await sendIdCardEmail({ toEmail: record.email, studentName: record.name, ticketId: record.ticketId,
        college: record.college, idCardBuffer, qrBuffer });
    },
  });
  try {
    do {
      try {
        const summary = await sendPendingEntryPasses({ db, deliverQueuedEmail: service.deliverQueuedEmail });
        console.log("Entry-pass email batch:", summary);
      } catch {
        if (process.argv.includes("--once")) throw new Error("The email queue could not be read. Retry the batch shortly.");
        console.error("The email queue is temporarily unavailable; checking again in one minute.");
      }
      if (process.argv.includes("--once")) break;
      await delay(60000);
    } while (true);
  } finally {
    await db.terminate();
    await deleteApp(app);
  }
}

run().catch(error => {
  console.error("Entry-pass sender stopped:", error.message);
  process.exitCode = 1;
});
