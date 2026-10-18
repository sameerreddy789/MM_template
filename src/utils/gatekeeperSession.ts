export type GatekeeperPaymentMode = "live" | "test";

export interface GatekeeperSession {
  token: string;
  expiresAt: number;
  paymentMode: GatekeeperPaymentMode;
  availableModes: GatekeeperPaymentMode[];
}

const storageKey = "mm26:staff-session";
const legacyKeys = ["mm26_admin_key", "mm26_admin_secret", "mm26_admin_mode", "mm26_admin_modes"];

export function parseGatekeeperSession(value: unknown): GatekeeperSession | null {
  if (!value || typeof value !== "object") return null;
  const session = value as Record<string, unknown>;
  if (typeof session.token !== "string" || session.token.length > 2048 ||
    !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(session.token) ||
    typeof session.expiresAt !== "number" || !Number.isSafeInteger(session.expiresAt) || session.expiresAt <= Date.now() ||
    (session.paymentMode !== "live" && session.paymentMode !== "test") || !Array.isArray(session.availableModes)) return null;
  const availableModes = session.availableModes.filter((mode): mode is GatekeeperPaymentMode => mode === "live" || mode === "test");
  if (!availableModes.includes(session.paymentMode)) return null;
  return { token: session.token, expiresAt: session.expiresAt, paymentMode: session.paymentMode, availableModes };
}

export function readGatekeeperSession(): GatekeeperSession | null {
  try {
    for (const key of legacyKeys) window.sessionStorage.removeItem(key);
    const session = parseGatekeeperSession(JSON.parse(window.sessionStorage.getItem(storageKey) || "null"));
    if (!session) window.sessionStorage.removeItem(storageKey);
    return session;
  } catch { return null; }
}

export function saveGatekeeperSession(session: GatekeeperSession) {
  try { window.sessionStorage.setItem(storageKey, JSON.stringify(session)); }
  catch { /* An authenticated tab still works when browser storage is unavailable. */ }
}

export function clearGatekeeperSession() {
  try {
    window.sessionStorage.removeItem(storageKey);
    for (const key of legacyKeys) window.sessionStorage.removeItem(key);
  } catch { /* Clearing in-memory state still ends this tab's session. */ }
}
