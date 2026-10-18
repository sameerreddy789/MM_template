import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import styles from "./Gatekeeper.module.scss";
import type { Html5Qrcode } from "html5-qrcode";
import { Helmet } from "react-helmet-async";
import { clearGatekeeperSession, parseGatekeeperSession, readGatekeeperSession, saveGatekeeperSession } from "../../utils/gatekeeperSession";

let scannerLoading: Promise<typeof import("html5-qrcode")> | null = null;
function loadScanner() {
  if (!scannerLoading) scannerLoading = import("html5-qrcode").catch(error => {
    scannerLoading = null;
    throw error;
  });
  return scannerLoading;
}

const SESSION_KEYS = ["day1_am", "day1_pm", "day2_am", "day2_pm"] as const;
type SessionKey = typeof SESSION_KEYS[number];
type PaymentMode = "test" | "live";
const SESSION_LABELS: Record<SessionKey, string> = {
  day1_am: "DAY 1 MORNING",
  day1_pm: "DAY 1 EVENING",
  day2_am: "DAY 2 MORNING",
  day2_pm: "DAY 2 EVENING",
};

interface CheckInSessionInfo {
  checkedIn: boolean;
  timestamp: string | null;
  gatekeeper?: string | null;
}

interface StudentData {
  ticketId: string;
  name: string;
  college: string;
  rollNo: string;
  email: string;
  phone: string;
  paymentStatus: string;
  paymentMode: PaymentMode;
  checkInStatus: string;
  checkedInAt?: string | null;
  checkInSessions?: Partial<Record<SessionKey, CheckInSessionInfo>>;
}

interface GatekeeperResponse {
  success: boolean;
  error?: string;
  code?: string;
  paymentMode?: PaymentMode;
  availableModes?: PaymentMode[];
  sessionToken?: string;
  sessionExpiresAt?: number;
  student?: StudentData;
  ticketId?: string;
  sessionKey?: SessionKey;
  checkedInAt?: string;
  checkInSessions?: Partial<Record<SessionKey, CheckInSessionInfo>>;
}

interface Operation {
  id: number;
  controller: AbortController;
  timeout: number;
}

interface Camera {
  scanner: Html5Qrcode;
  start?: Promise<unknown>;
  cleanup?: Promise<void>;
}

// Local staff tests must keep credentials and signed passes on the Vite proxy.
const backendUrl = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_BACKEND_URL || "https://mohanamantra-backend.onrender.com").replace(/\/$/, "");

async function fetchBackend(endpoint: string, options: RequestInit) {
  const response = await fetch(backendUrl + endpoint, {
    ...options, credentials: "omit", cache: "no-store",
  });
  const data: GatekeeperResponse = await response.json();
  return { status: response.status, data };
}

// Camera, file, paste, manual input and emailed links share the same parser.
// A URL is decoded locally; only its signed token is sent to our own API.
function parsePass(value: string): { token: string } | { ticketId: string } | null {
  const raw = value.trim();
  if (!raw || raw.length > 4096) return null;
  if (/^MM26-(?:TEST-)?[A-F0-9]{6}$/i.test(raw)) return { ticketId: raw.toUpperCase() };
  const isToken = (token: string) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
  if (isToken(raw)) return { token: raw };
  try {
    const url = new URL(raw, window.location.origin);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    const prefix = "/gatekeeper/verify/";
    const token = url.pathname.startsWith(prefix)
      ? decodeURIComponent(url.pathname.slice(prefix.length).replace(/\/$/, ""))
      : url.searchParams.get("token");
    if (token && isToken(token)) return { token };
  } catch { /* An invalid link is handled as an invalid pass below. */ }
  return null;
}

function formatCheckInTime(timestamp: string | null | undefined) {
  if (!timestamp || !Number.isFinite(new Date(timestamp).getTime())) return "Time unavailable";
  return new Date(timestamp).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

async function disposeCamera(camera: Camera) {
  if (!camera.cleanup) {
    camera.cleanup = (async () => {
      try { await camera.start; } catch { /* Permission/start failures still need cleanup. */ }
      try { if (camera.scanner.isScanning) await camera.scanner.stop(); } catch { /* A revoked camera can already be stopped. */ }
      try { camera.scanner.clear(); } catch { /* Its element may have unmounted. */ }
    })();
  }
  await camera.cleanup;
}

const Gatekeeper: React.FC = () => {
  const location = useLocation();
  const linkedPass = location.pathname.startsWith("/gatekeeper/verify/")
    ? location.pathname + location.search : "";
  const [activeSession, setActiveSession] = useState<SessionKey>("day1_am");
  const [staffSession, setStaffSession] = useState(readGatekeeperSession);
  const isAuthenticated = staffSession !== null;
  const paymentMode = staffSession?.paymentMode ?? null;
  const availableModes = staffSession?.availableModes ?? [];
  const [inputKey, setInputKey] = useState("");
  const [inputSecret, setInputSecret] = useState("");
  const [ticketInput, setTicketInput] = useState("");
  const [student, setStudent] = useState<StudentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successSession, setSuccessSession] = useState<SessionKey | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const mountedRef = useRef(true);
  const operationRef = useRef<Operation | null>(null);
  const nextOperationRef = useRef(0);
  const cameraRef = useRef<Camera | null>(null);
  const cameraWantedRef = useRef(false);
  const cameraEpochRef = useRef(0);
  const cameraTimerRef = useRef<number | null>(null);
  const cameraCleanupRef = useRef<Promise<void>>(Promise.resolve());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const beginOperation = useCallback(() => {
    // The ref closes the gap before React renders disabled controls.
    if (operationRef.current || !mountedRef.current) return null;
    const controller = new AbortController();
    const operation: Operation = {
      id: ++nextOperationRef.current,
      controller,
      timeout: window.setTimeout(() => controller.abort(), 90000),
    };
    operationRef.current = operation;
    setLoading(true);
    setError(null);
    setSuccessSession(null);
    return operation;
  }, []);

  const isCurrent = useCallback((operation: Operation) =>
    mountedRef.current && operationRef.current?.id === operation.id, []);

  const finishOperation = useCallback((operation: Operation) => {
    window.clearTimeout(operation.timeout);
    if (operationRef.current?.id !== operation.id) return;
    operationRef.current = null;
    if (mountedRef.current) setLoading(false);
  }, []);

  const cancelOperations = useCallback(() => {
    const operation = operationRef.current;
    operationRef.current = null;
    if (operation) {
      window.clearTimeout(operation.timeout);
      operation.controller.abort();
    }
    if (mountedRef.current) setLoading(false);
  }, []);

  const stopScanner = useCallback(async () => {
    cameraWantedRef.current = false;
    ++cameraEpochRef.current;
    if (cameraTimerRef.current !== null) {
      window.clearTimeout(cameraTimerRef.current);
      cameraTimerRef.current = null;
    }
    const camera = cameraRef.current;
    cameraRef.current = null;
    if (mountedRef.current) setIsScanning(false);
    if (camera) {
      cameraCleanupRef.current = Promise.all([
        cameraCleanupRef.current, disposeCamera(camera),
      ]).then(() => undefined);
    }
    await cameraCleanupRef.current;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelOperations();
      void stopScanner();
    };
  }, [cancelOperations, stopScanner]);

  const clearLogin = useCallback(() => {
    cancelOperations();
    void stopScanner();
    clearGatekeeperSession();
    setInputSecret("");
    setStaffSession(null);
    setTicketInput("");
    setStudent(null);
    setSuccessSession(null);
    setDragActive(false);
  }, [cancelOperations, stopScanner]);

  const expireLogin = useCallback(() => {
    clearLogin();
    setError("Admin session expired. Sign in again to verify this pass.");
  }, [clearLogin]);

  useEffect(() => {
    if (!staffSession) return;
    const timer = window.setTimeout(expireLogin, Math.max(0, staffSession.expiresAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [staffSession, expireLogin]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const operation = beginOperation();
    if (!operation) return;
    const key = inputKey.trim();
    const secret = inputSecret;
    const requestedMode = new URLSearchParams(location.search).get("mode");
    try {
      const { data } = await fetchBackend("/api/gatekeeper/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: key, adminSecret: secret,
          ...((requestedMode === "live" || requestedMode === "test") ? { paymentMode: requestedMode } : {}) }),
        signal: operation.controller.signal,
      });
      if (!isCurrent(operation)) return;
      const session = parseGatekeeperSession({
        token: data.sessionToken, expiresAt: data.sessionExpiresAt,
        paymentMode: data.paymentMode, availableModes: data.availableModes || [data.paymentMode],
      });
      if (data.success && session) {
        saveGatekeeperSession(session);
        setStaffSession(session);
        setInputSecret("");
      } else {
        setError(data.error || "Sign-in could not be confirmed. Check the admin ID and password.");
      }
    } catch {
      if (isCurrent(operation)) setError(operation.controller.signal.aborted
        ? "Authentication timed out. Try again." : "Failed to connect to the backend for authentication.");
    } finally { finishOperation(operation); }
  };

  const verifyPass = useCallback(async (value: string, operation: Operation) => {
    const pass = parsePass(value);
    if (!pass) {
      if (isCurrent(operation)) setError("Enter a valid ticket ID or scan an entry-pass QR code.");
      return;
    }
    try {
      const { status, data } = await fetchBackend("/api/gatekeeper/verify", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${staffSession?.token}` },
        body: JSON.stringify({ paymentMode, ...pass }),
        signal: operation.controller.signal,
      });
      if (!isCurrent(operation)) return;
      if (status === 401) { expireLogin(); return; }
      const verified = data.student;
      const correctMode = verified && verified.paymentMode === paymentMode
        && (verified.paymentMode === "test" ? /^MM26-TEST-[A-F0-9]{6}$/ : /^MM26-[A-F0-9]{6}$/).test(verified.ticketId);
      if (data.success && verified && correctMode && verified.paymentStatus === "Paid"
        && (!("ticketId" in pass) || pass.ticketId === verified.ticketId)) {
        setStudent(verified);
      } else {
        setError(data.error || "Ticket verification could not be confirmed.");
      }
    } catch {
      if (isCurrent(operation)) setError(operation.controller.signal.aborted
        ? "Ticket verification timed out. Try again." : "Network error while verifying ticket. Try again.");
    }
  }, [staffSession, paymentMode, expireLogin, isCurrent]);

  const verifyTokenOrId = useCallback(async (value: string) => {
    if (!isAuthenticated || cameraWantedRef.current) return;
    const operation = beginOperation();
    if (!operation) return;
    setStudent(null);
    try { await verifyPass(value, operation); }
    finally { finishOperation(operation); }
  }, [isAuthenticated, beginOperation, verifyPass, finishOperation]);

  // A changed route or logout invalidates a previous QR-link lookup.
  useEffect(() => {
    if (!isAuthenticated) return;
    setStudent(null);
    setSuccessSession(null);
    if (linkedPass) void verifyTokenOrId(linkedPass);
    return cancelOperations;
  }, [isAuthenticated, linkedPass, verifyTokenOrId, cancelOperations]);

  const handleCheckin = async () => {
    if (!student || student.checkInSessions?.[activeSession]?.checkedIn || cameraWantedRef.current) return;
    const operation = beginOperation();
    if (!operation) return;
    const ticketId = student.ticketId;
    const sessionKey = activeSession;
    const passMode = student.paymentMode;
    try {
      const { status, data } = await fetchBackend("/api/gatekeeper/checkin", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${staffSession?.token}` },
        body: JSON.stringify({ ticketId, sessionKey, paymentMode: passMode }),
        signal: operation.controller.signal,
      });
      if (!isCurrent(operation)) return;
      if (status === 401) { expireLogin(); return; }
      if (data.success && data.paymentMode === passMode && data.ticketId === ticketId && data.sessionKey === sessionKey
        && data.checkInSessions?.[sessionKey]?.checkedIn) {
        setStudent(previous => previous?.ticketId === ticketId ? {
          ...previous, checkInStatus: "Checked In", checkedInAt: data.checkedInAt,
          checkInSessions: data.checkInSessions,
        } : previous);
        setSuccessSession(sessionKey);
      } else if (data.code === "ALREADY_CHECKED_IN" && data.sessionKey === sessionKey
        && data.checkInSessions?.[sessionKey]?.checkedIn) {
        setStudent(previous => previous?.ticketId === ticketId
          ? { ...previous, checkInSessions: data.checkInSessions } : previous);
        setError("Check-in already recorded for " + SESSION_LABELS[sessionKey] + ". No second entry was recorded.");
      } else {
        if (data.success) setStudent(null);
        setError(data.error || "Check-in could not be confirmed. Verify the pass again before retrying.");
      }
    } catch {
      if (isCurrent(operation)) {
        setStudent(null);
        setError("Check-in could not be confirmed. Verify the pass again before retrying.");
      }
    } finally { finishOperation(operation); }
  };

  const startScanner = () => {
    if (operationRef.current || cameraWantedRef.current || !isAuthenticated) return;
    cameraWantedRef.current = true;
    const epoch = ++cameraEpochRef.current;
    setStudent(null);
    setSuccessSession(null);
    setError(null);
    setIsScanning(true);
    // The tracked timer lets React reveal the reader before camera sizing.
    cameraTimerRef.current = window.setTimeout(async () => {
      cameraTimerRef.current = null;
      await cameraCleanupRef.current;
      if (!mountedRef.current || !cameraWantedRef.current || cameraEpochRef.current !== epoch) return;
      try {
        const { Html5Qrcode } = await loadScanner();
        if (!mountedRef.current || !cameraWantedRef.current || cameraEpochRef.current !== epoch) return;
        const camera: Camera = { scanner: new Html5Qrcode("reader") };
        cameraRef.current = camera;
        camera.start = camera.scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: (width, height) => {
            const size = Math.floor(Math.min(250, Math.min(width, height) * 0.75));
            return { width: size, height: size };
          } },
          decodedText => {
            if (!cameraWantedRef.current || cameraEpochRef.current !== epoch || operationRef.current) return;
            void stopScanner();
            void verifyTokenOrId(decodedText);
          },
          () => undefined,
        );
        await camera.start;
      } catch {
        if (mountedRef.current && cameraEpochRef.current === epoch) {
          setError("Could not access camera. Allow camera permission or upload the pass QR image.");
          void stopScanner();
        }
      }
    }, 0);
  };

  const processQRImageFile = useCallback(async (file: File) => {
    if (!isAuthenticated || cameraWantedRef.current) return;
    const operation = beginOperation();
    if (!operation) return;
    setStudent(null);
    let scanner: Html5Qrcode | null = null;
    try {
      if (!file.type.startsWith("image/") || file.size > 10 * 1024 * 1024) {
        setError("Choose a QR image smaller than 10 MB.");
        return;
      }
      const { Html5Qrcode } = await loadScanner();
      if (!isCurrent(operation)) return;
      scanner = new Html5Qrcode("reader-hidden");
      const decodedText = await scanner.scanFile(file, false);
      if (isCurrent(operation)) await verifyPass(decodedText, operation);
    } catch {
      if (isCurrent(operation)) setError("Could not read QR code from image. Upload a clear pass or QR image.");
    } finally {
      try { scanner?.clear(); } catch { /* The reader may have unmounted during logout. */ }
      finishOperation(operation);
    }
  }, [isAuthenticated, beginOperation, isCurrent, verifyPass, finishOperation]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!isAuthenticated || operationRef.current || cameraWantedRef.current) return;
      for (const item of event.clipboardData?.items || []) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) { event.preventDefault(); void processQRImageFile(file); }
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isAuthenticated, processQRImageFile]);

  const controlsDisabled = loading || isScanning;
  const currentSessionInfo = student?.checkInSessions?.[activeSession];
  const isCheckedInForActiveSession = !!currentSessionInfo?.checkedIn;
  const isTest = paymentMode === "test" || student?.paymentMode === "test";
  const modeOptions = availableModes.length ? availableModes : paymentMode ? [paymentMode] : [];

  const changePassMode = (mode: PaymentMode) => {
    if (operationRef.current || cameraWantedRef.current || !availableModes.includes(mode)) return;
    if (!staffSession) return;
    const nextSession = { ...staffSession, paymentMode: mode };
    saveGatekeeperSession(nextSession);
    setStaffSession(nextSession);
    setTicketInput("");
    setStudent(null);
    setSuccessSession(null);
    setError(null);
  };

  const changeTicketInput = (value: string) => {
    if (operationRef.current || cameraWantedRef.current) return;
    setTicketInput(value);
    setStudent(null);
    setSuccessSession(null);
    setError(null);
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Gatekeeper | Private Admin</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.badge}>MOHANA MANTRA 2K26</div>
          <h1>Gatekeeper Verification Portal</h1>
          <p>Select a session, verify a pass, then confirm its check-in.</p>
        </div>
        {isAuthenticated && (
          <button className={styles.logoutBtn} onClick={() => { clearLogin(); setError(null); }}>
            🔒 Exit Admin
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.lockIcon} aria-hidden="true">🔐</div>
            <h2>Admin Authentication</h2>
            <p>Enter your admin ID and password to access the gate scanner.</p>
          </div>
          {error && <div className={styles.errorBanner} role="alert">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label htmlFor="admin-key">ADMIN ID</label>
              <input id="admin-key" name="username" type="text" autoComplete="username"
                value={inputKey} onChange={event => setInputKey(event.target.value)} required disabled={loading} />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="admin-secret">PASSWORD</label>
              <input id="admin-secret" name="password" type="password" autoComplete="current-password"
                value={inputSecret} onChange={event => setInputSecret(event.target.value)} required disabled={loading} />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Authenticating..." : "Unlock Gatekeeper"}
            </button>
          </form>
        </div>
      )}

      {isAuthenticated && (
        <div className={styles.dashboard} aria-busy={loading}>
          {modeOptions.length > 1 && <div className={styles.sessionBar}>
            <div className={styles.sessionLabel}>PASS TYPE</div>
            <div className={styles.sessionPills}>
              {modeOptions.map(mode => <button key={mode} disabled={controlsDisabled} aria-pressed={paymentMode === mode}
                className={styles.sessionPill + (paymentMode === mode ? " " + styles.activePill : "")}
                onClick={() => changePassMode(mode)}>
                {mode === "test" ? "Test passes (demo)" : "Live passes"}
              </button>)}
            </div>
          </div>}
          {isTest && (
            <div className={styles.modeBanner} role="status">
              <strong>TEST PASSES — NOT VALID FOR EVENT ENTRY</strong>
              <span>These checks update test registrations only. No real admission is granted.</span>
            </div>
          )}
          <div className={styles.sessionBar}>
            <div className={styles.sessionLabel}>1. SELECT CHECK-IN SESSION</div>
            <div className={styles.sessionPills}>
              {SESSION_KEYS.map(session => (
                <button key={session} disabled={controlsDisabled} aria-pressed={activeSession === session}
                  className={styles.sessionPill + (activeSession === session ? " " + styles.activePill : "")}
                  onClick={() => {
                    if (operationRef.current || cameraWantedRef.current) return;
                    setActiveSession(session); setSuccessSession(null); setError(null);
                  }}>
                  {session.includes("am") ? "🌅" : "🌙"} {SESSION_LABELS[session]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlsCard}>
            <label htmlFor="ticket-id" className={styles.fieldLabel}>2. VERIFY THE PASS</label>
            <div className={styles.inputRow}>
              <input id="ticket-id" type="text" autoComplete="off" spellCheck={false} maxLength={4096}
                aria-label="Ticket ID or QR link" disabled={controlsDisabled}
                placeholder={isTest ? "Ticket ID (MM26-TEST-XXXXXX) or QR link" : "Ticket ID (MM26-XXXXXX) or QR link"}
                value={ticketInput} onChange={event => changeTicketInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") { event.preventDefault(); void verifyTokenOrId(ticketInput); }
                }} />
              <button onClick={() => void verifyTokenOrId(ticketInput)} disabled={controlsDisabled || !ticketInput.trim()}>
                {loading ? "Verifying..." : "Verify Ticket"}
              </button>
            </div>
            <div className={styles.scannerToggle}>
              <button onClick={() => isScanning ? void stopScanner() : startScanner()} disabled={loading}>
                📷 {isScanning ? "Stop Camera Scanner" : "Open Camera Scanner"}
              </button>
            </div>
            <div id="reader" className={styles.qrReaderBox} hidden={!isScanning}></div>
            <button type="button" disabled={controlsDisabled}
              className={styles.dropzone + (dragActive ? " " + styles.dragActive : "")}
              onDragOver={event => { event.preventDefault(); if (!controlsDisabled) setDragActive(true); }}
              onDragLeave={event => { event.preventDefault(); setDragActive(false); }}
              onDrop={event => {
                event.preventDefault(); setDragActive(false);
                if (!operationRef.current && !cameraWantedRef.current && event.dataTransfer.files[0])
                  void processQRImageFile(event.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}>
              <span className={styles.dropIcon} aria-hidden="true">📁 / 📋</span>
              <span className={styles.dropText}>Upload, drop or paste a pass QR image</span>
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" aria-label="Upload pass QR image"
              disabled={controlsDisabled} hidden onChange={event => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void processQRImageFile(file);
              }} />
            <div id="reader-hidden" hidden></div>
            <p className={styles.helperText}>Scanning verifies the pass. Use the confirmation button below to save the selected session.</p>
          </div>

          {successSession && (
            <div className={styles.successBanner} role="status">
              {isTest ? "Test check-in saved for " : "Check-in saved for "}
              <strong>{SESSION_LABELS[successSession]}</strong>.
            </div>
          )}
          {error && <div className={styles.errorBanner} role="alert">{error}</div>}

          {student && (
            <div className={styles.resultCard}>
              <div className={styles.statusHeader + " " +
                (isCheckedInForActiveSession ? styles.checkedIn : isTest ? styles.testTicket : styles.valid)}>
                {isCheckedInForActiveSession
                  ? (isTest ? "TEST CHECK-IN ALREADY RECORDED FOR " : "ALREADY CHECKED IN FOR ") + SESSION_LABELS[activeSession]
                  : (isTest ? "TEST PASS VERIFIED FOR " : "PASS VERIFIED — CONFIRM ENTRY FOR ") + SESSION_LABELS[activeSession]}
              </div>
              <div className={styles.studentDetails}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><div className={styles.label}>STUDENT NAME</div><div className={styles.value}>{student.name}</div></div>
                  <div className={styles.detailItem}><div className={styles.label}>TICKET ID</div><div className={styles.value}>{student.ticketId}</div></div>
                  <div className={styles.detailItem}><div className={styles.label}>COLLEGE</div><div className={styles.value}>{student.college}</div></div>
                  <div className={styles.detailItem}><div className={styles.label}>PAYMENT STATUS</div><div className={styles.value}>💳 {student.paymentStatus}{isTest ? " (Test)" : ""}</div></div>
                </div>
                <div className={styles.sessionMatrix}>
                  <div className={styles.matrixTitle}>4-SESSION CHECK-IN HISTORY · INDIA TIME</div>
                  <div className={styles.matrixGrid}>
                    {SESSION_KEYS.map(session => {
                      const info = student.checkInSessions?.[session];
                      return (
                        <div key={session} className={styles.matrixCard + (info?.checkedIn ? " " + styles.matrixCheckedIn : "")}>
                          <div className={styles.matrixSessionName}>{SESSION_LABELS[session]}</div>
                          <div className={styles.matrixStatus}>{info?.checkedIn ? "🟢 Checked In" : "⚪ Pending"}</div>
                          {info?.checkedIn && (
                            <>
                              <div className={styles.matrixTimestamp}>{formatCheckInTime(info.timestamp)}</div>
                              <div className={styles.matrixTimestamp}>Admin: {info.gatekeeper || "Not recorded"}</div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className={styles.actionSection}>
                {!isCheckedInForActiveSession ? (
                  <button className={styles.checkinBtn} onClick={() => void handleCheckin()} disabled={controlsDisabled}>
                    {loading ? "Saving..." : (isTest ? "RECORD TEST CHECK-IN FOR " : "CONFIRM ENTRY FOR ") + SESSION_LABELS[activeSession]}
                  </button>
                ) : (
                  <div className={styles.timestampNotice}>
                    Recorded: {formatCheckInTime(currentSessionInfo?.timestamp)}
                    {currentSessionInfo?.gatekeeper && <span> · Admin: {currentSessionInfo.gatekeeper}</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Gatekeeper;
