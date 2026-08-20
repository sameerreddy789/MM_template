// ==========================================
// MohanaMantra 2K26 — Firebase Firestore Configuration
// ==========================================
// Direct client-side Firestore integration for saving registrations
// without requiring an intermediate backend server.
// ==========================================

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

// Read Firebase web config from Vite environment variables (.env)
// If environment variables are not yet provided, fallbacks prevent runtime crashes.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForMohanaMantra2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mohanamantra-2026.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mohanamantra-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mohanamantra-2026.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
};

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

export interface StudentRegistrationRecord {
  ticketId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  rollNo: string;
  paymentId: string;
  amount: number;
  paymentStatus: "Paid" | "Pending" | "Failed";
  checkInStatus: "Not Checked In" | "Checked In";
  createdAt?: any;
}

/**
 * Save confirmed student registration directly to Firestore 'registrations' collection
 */
export async function saveRegistrationToFirestore(data: {
  ticketId: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  rollNo: string;
  paymentId: string;
  amount?: number;
}) {
  try {
    const registrationRef = doc(db, "registrations", data.ticketId);
    const record: StudentRegistrationRecord = {
      ticketId: data.ticketId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      college: data.college,
      rollNo: data.rollNo,
      paymentId: data.paymentId,
      amount: data.amount || 1000,
      paymentStatus: "Paid",
      checkInStatus: "Not Checked In",
      createdAt: serverTimestamp(),
    };

    await setDoc(registrationRef, record);
    console.log(`✅ Student registered successfully in Firestore: ${data.ticketId}`);
    return { success: true, record };
  } catch (error) {
    console.warn("⚠️ Failed to write directly to Firestore (check Firebase config / rules):", error);
    return { success: false, error };
  }
}
