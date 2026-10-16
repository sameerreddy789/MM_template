// Consume paid entry-pass records using the same transactional email lease as
// payment callbacks. This helper never creates a registration or payment.
const { paymentEnvironment, recordMatchesMode } = require("./paymentEnvironment");

async function sendPendingEntryPasses({ db, deliverQueuedEmail, batchSize = 25, config = process.env }) {
  const environment = paymentEnvironment(config);
  const statuses = ["Pending", "Failed", "Sending"];
  const snapshots = await Promise.all(statuses.map(status =>
    db.collection(environment.registrationsCollection).where("emailStatus", "==", status).limit(batchSize).get()
  ));
  const result = { sent: 0, failed: 0, pending: 0, skipped: 0 };
  const seen = new Set();
  for (const snapshot of snapshots) {
    for (const document of snapshot.docs) {
      if (seen.has(document.id)) continue;
      seen.add(document.id);
      const record = document.data();
      if (!recordMatchesMode(record, environment.mode) || record.paymentStatus !== "Paid" ||
          (record.emailStatus === "Sending" && record.emailLeaseUntil > Date.now())) {
        result.skipped++;
        continue;
      }
      try {
        const status = await deliverQueuedEmail(document.ref);
        if (status === "Sent") result.sent++;
        else if (status === "Failed") result.failed++;
        else result.pending++;
      } catch {
        result.failed++;
      }
    }
  }
  return result;
}

module.exports = { sendPendingEntryPasses };
