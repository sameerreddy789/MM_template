// Vercel serverless function: authorized read-only registrations viewer.
// Reads Firestore directly with a service account so /rcheck works on Vercel
// (which deploys reliably) independent of the Render backend.
import admin from "firebase-admin";
import crypto from "node:crypto";

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ah = crypto.createHash("sha256").update(a).digest();
  const bh = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ah, bh);
}

let cachedApp;
function getDb() {
  if (!cachedApp) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT is not configured");
    const serviceAccount = JSON.parse(raw);
    cachedApp = admin.apps.length
      ? admin.apps[0]
      : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin.firestore();
}

function toIso(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") { try { return value.toDate().toISOString(); } catch { return null; } }
  if (value._seconds !== undefined) return new Date(value._seconds * 1000).toISOString();
  return typeof value === "string" ? value : null;
}

const clean = (v) => (typeof v === "string" ? v.trim() : "");

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.status(405).json({ success: false, error: "Method not allowed." });
    return;
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body && typeof body === "object" ? body : {};

  const expId = process.env.RCHECK_ID;
  const expPassword = process.env.RCHECK_PASSWORD;
  if (!expId || !expPassword || !timingSafeEqual(body.id, expId) || !timingSafeEqual(body.password, expPassword)) {
    res.status(401).json({ success: false, error: "Invalid ID or password." });
    return;
  }

  try {
    const db = getDb();
    const mode = "live";
    const [ordersSnap, ticketsSnap] = await Promise.all([
      db.collection("registrationOrders").get(),
      db.collection("registrations").get(),
    ]);

    const rows = new Map();
    ordersSnap.forEach((doc) => {
      const o = doc.data();
      if (o.paymentMode !== undefined && o.paymentMode !== mode) return;
      const s = o.student || {};
      rows.set(doc.id, {
        name: clean(s.name || o.name),
        email: clean(s.email || o.email),
        phone: clean(s.phone || o.phone),
        college: clean(s.college || o.college),
        paymentStatus: clean(o.paymentStatus) || "Pending",
        ticketId: clean(o.ticketId),
        createdAt: toIso(o.createdAt),
      });
    });
    ticketsSnap.forEach((doc) => {
      const t = doc.data();
      if (t.paymentMode !== undefined && t.paymentMode !== mode) return;
      const key = t.orderId || doc.id;
      const ex = rows.get(key);
      rows.set(key, {
        name: clean(t.name) || ex?.name || "",
        email: clean(t.email) || ex?.email || "",
        phone: clean(t.phone) || ex?.phone || "",
        college: clean(t.college) || ex?.college || "",
        paymentStatus: clean(t.paymentStatus) || "Paid",
        ticketId: clean(t.ticketId) || doc.id,
        createdAt: toIso(t.createdAt) || ex?.createdAt || null,
      });
    });

    const registrations = [...rows.values()].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    res.status(200).json({ success: true, count: registrations.length, paymentMode: mode, registrations });
  } catch (error) {
    res.status(503).json({ success: false, error: "Could not read registrations." });
  }
}
