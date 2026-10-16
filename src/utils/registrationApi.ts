export interface RegistrationDetails {
  name: string;
  email: string;
  phone: string;
  college: string;
  roll_no: string;
}

export type PaymentMode = "test" | "live";

export interface PaymentOrder {
  order_id: string;
  key_id: string;
  amount: number;
  currency: "INR";
  paymentMode: PaymentMode;
}

export interface PaymentProof {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class CheckoutConfirmationError extends Error {}

const pendingCheckoutKey = "mm26:pending-checkout";

// Keep a payment recoverable in this tab without storing student details or server secrets.
export function readPendingCheckout(mode: PaymentMode): { orderId: string; proof: PaymentProof | null } | null {
  try {
    const pending = object(JSON.parse(window.sessionStorage.getItem(`${pendingCheckoutKey}:${mode}`) || "null"));
    if (typeof pending.orderId !== "string" || !/^order_[A-Za-z0-9_]{1,64}$/.test(pending.orderId)) return null;
    const proof = object(pending.proof);
    return {
      orderId: pending.orderId,
      proof: proof.razorpay_order_id === pending.orderId && typeof proof.razorpay_payment_id === "string" &&
        /^pay_[A-Za-z0-9_]{1,64}$/.test(proof.razorpay_payment_id) && typeof proof.razorpay_signature === "string" &&
        /^[a-f0-9]{64}$/i.test(proof.razorpay_signature)
        ? proof as unknown as PaymentProof : null,
    };
  } catch {
    return null;
  }
}

export function savePendingCheckout(mode: PaymentMode, orderId: string, proof: PaymentProof | null = null) {
  try {
    window.sessionStorage.setItem(`${pendingCheckoutKey}:${mode}`, JSON.stringify({ orderId, proof }));
  } catch {
    // Checkout and verification still work if this browser blocks session storage.
  }
}

export function clearPendingCheckout(mode: PaymentMode) {
  try {
    window.sessionStorage.removeItem(`${pendingCheckoutKey}:${mode}`);
  } catch {
    // No persisted checkout exists when storage is unavailable.
  }
}

export interface ConfirmedRegistration {
  ticketId: string;
  name: string;
  email: string;
  paymentId: string;
  amount: number;
  paymentStatus: "Paid";
  paymentMode: PaymentMode;
  emailStatus: "Pending" | "Sending" | "Sent" | "Failed";
}

type PaymentConfirmation =
  | { success: true; registration: ConfirmedRegistration }
  | { success: false; paymentStatus: "Pending" };

interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: PaymentProof) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void; close: () => void };
  }
}

const feeInPaise = 100000;
const apiBase = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

async function request(endpoint: string, body?: unknown, signal?: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener("abort", abort, { once: true });
  const timeout = window.setTimeout(abort, 90000);
  try {
    const response = await fetch(`${apiBase}${endpoint}`, {
      method: body === undefined ? "GET" : "POST",
      ...(body === undefined ? {} : {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      cache: "no-store",
      credentials: "omit",
      signal: controller.signal,
    });
    const data = object(await response.json().catch(() => null));
    if (!response.ok) {
      const knownError = typeof data.code === "string" && [
        "INVALID_DETAILS", "INVALID_EMAIL", "INVALID_PHONE", "PAYMENTS_UNAVAILABLE",
        "ORDER_UNAVAILABLE", "REGISTRATION_UNAVAILABLE", "VERIFICATION_UNAVAILABLE",
        "PAYMENT_MISMATCH", "PAYMENT_INCOMPLETE", "INVALID_PROOF", "INVALID_SIGNATURE",
        "EMAIL_STATUS_UNAVAILABLE", "UNKNOWN_ORDER", "PAYMENT_CONFLICT",
      ].includes(data.code);
      throw new Error(knownError && typeof data.error === "string"
        ? data.error
        : response.status === 429
          ? "Please wait a few minutes before trying again."
          : "Payments are temporarily unavailable. Please try again shortly.");
    }
    return data;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

export async function checkRegistrationAvailability(signal?: AbortSignal): Promise<{ ready: boolean; paymentMode: PaymentMode }> {
  const status = await request("/api/registration-status", undefined, signal);
  if (status.paymentMode !== "test" && status.paymentMode !== "live") {
    throw new Error("The payment environment could not be verified. Please try again before paying.");
  }
  return { ready: status.ready === true && status.amount === feeInPaise && status.currency === "INR", paymentMode: status.paymentMode };
}

export async function createRegistrationOrder(details: RegistrationDetails, signal?: AbortSignal): Promise<PaymentOrder> {
  const data = await request("/api/register", details, signal);
  if (data.success !== true || typeof data.order_id !== "string" || !/^order_[A-Za-z0-9_]{1,64}$/.test(data.order_id) ||
    typeof data.key_id !== "string" || !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(data.key_id) ||
    (data.paymentMode !== "test" && data.paymentMode !== "live") || !data.key_id.startsWith(`rzp_${data.paymentMode}_`) ||
    data.amount !== feeInPaise || data.currency !== "INR") {
    throw new Error("Your payment order could not be validated. Please try again before paying.");
  }
  return { order_id: data.order_id, key_id: data.key_id, amount: feeInPaise, currency: "INR", paymentMode: data.paymentMode };
}

export async function verifyRegistrationPayment(proof: PaymentProof, mode: PaymentMode, signal?: AbortSignal): Promise<PaymentConfirmation> {
  const data = await request("/api/payment-verify", proof, signal);
  if (data.success === false && data.paymentStatus === "Pending") {
    return { success: false, paymentStatus: "Pending" };
  }
  const registration = object(data.registration);
  if (data.success !== true || registration.paymentStatus !== "Paid" || registration.amount !== feeInPaise / 100 ||
    registration.paymentMode !== mode || typeof registration.ticketId !== "string" ||
    !(mode === "test" ? /^MM26-TEST-[A-F0-9]{6}$/ : /^MM26-[A-F0-9]{6}$/).test(registration.ticketId) ||
    typeof registration.name !== "string" || typeof registration.email !== "string" ||
    registration.paymentId !== proof.razorpay_payment_id ||
    !["Pending", "Sending", "Sent", "Failed"].includes(String(registration.emailStatus))) {
    throw new Error("Your registration could not be confirmed yet. Keep your receipt and check payment status here; do not pay again.");
  }
  return { success: true, registration: registration as unknown as ConfirmedRegistration };
}

let sdkLoading: Promise<void> | null = null;

async function loadCheckout() {
  if (window.Razorpay) return;
  if (!sdkLoading) {
    sdkLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      const timeout = window.setTimeout(() => finish(false), 20000);
      const finish = (loaded: boolean) => {
        window.clearTimeout(timeout);
        script.onload = null;
        script.onerror = null;
        if (loaded && window.Razorpay) resolve();
        else {
          script.remove();
          reject(new Error("Razorpay checkout could not be loaded. Check your connection and try again."));
        }
      };
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      document.head.appendChild(script);
    }).finally(() => { sdkLoading = null; });
  }
  return sdkLoading;
}

export async function openRegistrationCheckout(order: PaymentOrder, details: RegistrationDetails, signal?: AbortSignal): Promise<PaymentProof | null> {
  await loadCheckout();
  if (signal?.aborted) throw new DOMException("Checkout was interrupted.", "AbortError");
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) return reject(new Error("Razorpay checkout is unavailable. Please try again."));
    let settled = false;
    const finish = (proof: PaymentProof | null, failure?: Error) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abort);
      if (failure) reject(failure);
      else resolve(proof);
    };
    const checkout = new window.Razorpay({
      key: order.key_id,
      order_id: order.order_id,
      amount: order.amount,
      currency: order.currency,
      name: "MohanaMantra 2K26",
      description: order.paymentMode === "test" ? "TEST festival registration — no real charge" : "Festival registration",
      prefill: { name: details.name, email: details.email, contact: details.phone },
      theme: { color: "#861b24" },
      handler: response => {
        const proof = object(response);
        if (proof.razorpay_order_id !== order.order_id || typeof proof.razorpay_payment_id !== "string" ||
          !/^pay_[A-Za-z0-9_]{1,64}$/.test(proof.razorpay_payment_id) || typeof proof.razorpay_signature !== "string" ||
          !/^[a-f0-9]{64}$/i.test(proof.razorpay_signature)) {
          finish(null, new CheckoutConfirmationError("The checkout confirmation is incomplete. Keep your Razorpay receipt and contact the registration team before paying again."));
        } else finish(response);
      },
      modal: { ondismiss: () => finish(null) },
    });
    const abort = () => {
      finish(null, new DOMException("Checkout was interrupted.", "AbortError"));
      checkout.close();
    };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      checkout.open();
    } catch (failure) {
      finish(null, failure instanceof Error ? failure : new Error("Razorpay checkout could not be opened. Please try again."));
    }
  });
}
