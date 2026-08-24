// ==========================================
// MohanaMantra 2K26 — Multi-Session Check-In Test
// ==========================================
// Tests 4 distinct session check-ins for ticket MM26-79A7F0
// ==========================================

const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
require("dotenv").config();

const keyPath = path.join(__dirname, "serviceAccountKey.json");
const serviceAccount = require(keyPath);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}
const db = getFirestore();

async function testMultiSession() {
  console.log("🧪 Testing 4-Session Check-In System...");

  const ticketId = "MM26-79A7F0";
  const docRef = db.collection("registrations").doc(ticketId);

  // Reset sessions for test
  await docRef.set(
    {
      checkInSessions: {
        day1_am: { checkedIn: false, timestamp: null },
        day1_pm: { checkedIn: false, timestamp: null },
        day2_am: { checkedIn: false, timestamp: null },
        day2_pm: { checkedIn: false, timestamp: null },
      },
      checkInStatus: "Not Checked In",
    },
    { merge: true }
  );

  console.log("✅ Reset sessions to Pending!");

  // Verify initial state
  const snap = await docRef.get();
  console.log("Initial Sessions:", snap.data().checkInSessions);
}

testMultiSession();
