import React, { useState, useEffect, useRef } from "react";
import styles from "./Gatekeeper.module.scss";
import { Html5Qrcode } from "html5-qrcode";
import { Helmet } from "react-helmet-async";

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
  checkInStatus: string;
  checkedInAt?: string | null;
  checkInSessions?: Record<string, CheckInSessionInfo>;
}

const SESSION_LABELS: Record<string, string> = {
  day1_am: "DAY 1 MORNING",
  day1_pm: "DAY 1 EVENING",
  day2_am: "DAY 2 MORNING",
  day2_pm: "DAY 2 EVENING",
};

const Gatekeeper: React.FC = () => {
  // Active Gate Session State (day1_am, day1_pm, day2_am, day2_pm)
  const [activeSession, setActiveSession] = useState<"day1_am" | "day1_pm" | "day2_am" | "day2_pm">("day1_am");

  // Key-Value Pair Admin Credentials
  const [adminKey, setAdminKey] = useState<string>(() => sessionStorage.getItem("mm26_admin_key") || "");
  const [adminSecret, setAdminSecret] = useState<string>(() => sessionStorage.getItem("mm26_admin_secret") || "");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!sessionStorage.getItem("mm26_admin_key"));

  // Input fields for Login
  const [inputKey, setInputKey] = useState<string>("");
  const [inputSecret, setInputSecret] = useState<string>("");

  // Verification & Search
  const [ticketInput, setTicketInput] = useState<string>("");
  const [student, setStudent] = useState<StudentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [checkinSuccess, setCheckinSuccess] = useState<boolean>(false);

  // QR Scanner State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Smart Backend API fetcher
  const fetchBackend = async (endpoint: string, options: RequestInit) => {
    const urls: string[] = [];
    
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      urls.push("http://localhost:4000");
    }
    if (import.meta.env.VITE_BACKEND_URL) {
      urls.push(import.meta.env.VITE_BACKEND_URL);
    }
    urls.push("https://mohanamantra-backend.onrender.com");

    const uniqueUrls = Array.from(new Set(urls));
    let lastErr: any = null;

    for (const baseUrl of uniqueUrls) {
      try {
        const res = await fetch(`${baseUrl}${endpoint}`, options);
        const data = await res.json();
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Failed to connect to backend server.");
  };

  // Perform Admin Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await fetchBackend("/api/gatekeeper/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: inputKey, adminSecret: inputSecret }),
      });

      if (data && data.success) {
        setAdminKey(inputKey);
        setAdminSecret(inputSecret);
        sessionStorage.setItem("mm26_admin_key", inputKey);
        sessionStorage.setItem("mm26_admin_secret", inputSecret);
        setIsAuthenticated(true);
      } else {
        setError(data?.error || "Invalid Key-Value credentials.");
      }
    } catch (err: any) {
      setError("Failed to connect to backend for authentication.");
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem("mm26_admin_key");
    sessionStorage.removeItem("mm26_admin_secret");
    setIsAuthenticated(false);
    setStudent(null);
    stopScanner();
  };

  // Verify Token or Ticket ID
  const verifyTokenOrId = async (tokenOrId: string, isToken: boolean = false) => {
    if (!tokenOrId.trim()) return;
    setLoading(true);
    setError(null);
    setCheckinSuccess(false);

    try {
      const payload: any = { adminKey, adminSecret };
      if (isToken) payload.token = tokenOrId;
      else payload.ticketId = tokenOrId;

      const data = await fetchBackend("/api/gatekeeper/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (data && data.success) {
        setStudent(data.student);
      } else {
        setError(data?.error || "Invalid ticket or QR code.");
        setStudent(null);
      }
    } catch (err: any) {
      setError("Network error while verifying ticket.");
    } finally {
      setLoading(false);
    }
  };

  // Perform Session Check-in
  const handleCheckin = async () => {
    if (!student) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchBackend("/api/gatekeeper/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: student.ticketId,
          sessionKey: activeSession,
          adminKey,
          adminSecret,
        }),
      });

      if (data && data.success) {
        setCheckinSuccess(true);
        const updatedSessions = data.checkInSessions || {
          ...student.checkInSessions,
          [activeSession]: { checkedIn: true, timestamp: data.checkedInAt },
        };
        setStudent((prev) =>
          prev
            ? {
                ...prev,
                checkInStatus: "Checked In",
                checkedInAt: data.checkedInAt || new Date().toISOString(),
                checkInSessions: updatedSessions,
              }
            : null
        );
      } else if (data?.error?.includes("already checked in")) {
        const updatedSessions = data.checkInSessions || {
          ...student.checkInSessions,
          [activeSession]: { checkedIn: true, timestamp: data.checkedInAt || new Date().toISOString() },
        };
        setStudent((prev) =>
          prev
            ? {
                ...prev,
                checkInSessions: updatedSessions,
              }
            : null
        );
        setError(`⚠️ Student is already checked in for ${SESSION_LABELS[activeSession]}!`);
      } else {
        setError(data?.error || "Check-in failed.");
      }
    } catch (err: any) {
      setError("Failed to perform check-in.");
    } finally {
      setLoading(false);
    }
  };

  const toggleScanner = async () => {
    if (isScanning) await stopScanner();
    else startScanner();
  };

  const startScanner = () => {
    setIsScanning(true);
    setTimeout(() => {
      const html5QrCode = new Html5Qrcode("reader");
      html5QrCodeRef.current = html5QrCode;
      html5QrCode
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (decodedText.includes("/gatekeeper/verify/")) {
              const token = decodedText.split("/gatekeeper/verify/")[1];
              verifyTokenOrId(token, true);
            } else if (decodedText.includes("token=")) {
              const urlParams = new URLSearchParams(decodedText.split("?")[1]);
              const token = urlParams.get("token");
              if (token) verifyTokenOrId(token, true);
            } else {
              verifyTokenOrId(decodedText, false);
            }
            stopScanner();
          },
          () => {}
        )
        .catch((err) => {
          console.error(err);
          setError("Could not access camera.");
          setIsScanning(false);
        });
    }, 200);
  };

  const stopScanner = async () => {
  if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
  try {
  await html5QrCodeRef.current.stop();
  } catch (e) {
  // Html5Qrcode throws "Cannot stop, scanner is not running" when the underlying
  // camera was already torn down (tab switch, permission revoke, browser
  // closing). That's expected — surface it as a warning so silent failures
  // don't pile up in the console, but don't break the rest of the cleanup.
  console.warn("html5Qrcode.stop() failed:", e);
  }
  }
  setIsScanning(false);
  };

  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const processQRImageFile = async (file: File) => {
    setLoading(true);
    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);
      if (decodedText.includes("/gatekeeper/verify/")) {
        const token = decodedText.split("/gatekeeper/verify/")[1];
        verifyTokenOrId(token, true);
      } else {
        verifyTokenOrId(decodedText, false);
      }
    } catch (err: any) {
      setError("Could not read QR code from image.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isAuthenticated) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) processQRImageFile(file);
          break;
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isAuthenticated]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) processQRImageFile(e.dataTransfer.files[0]); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) processQRImageFile(e.target.files[0]); };

  const currentSessionInfo = student?.checkInSessions?.[activeSession];
  const isCheckedInForActiveSession = !!currentSessionInfo?.checkedIn;

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Gatekeeper | Private Admin</title>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet" />
      </Helmet>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.badge}>MOHANA MANTRA 2K26</div>
          <h1>Gatekeeper Verification Portal</h1>
          <p>Scan or verify outsider pass QR codes across 4 sessions over 2 days.</p>
        </div>
        {isAuthenticated && (
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🔒 Exit Admin
          </button>
        )}
      </div>

      {!isAuthenticated && (
        <div className={styles.loginCard}>
          <div className={styles.cardHeader}>
            <div className={styles.lockIcon}>🔐</div>
            <h2>Admin Authentication</h2>
            <p>Enter your Key-Value credentials to access the gate scanner.</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>ADMIN KEY</label>
              <input type="text" value={inputKey} onChange={(e) => setInputKey(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label>ADMIN SECRET</label>
              <input type="password" value={inputSecret} onChange={(e) => setInputSecret(e.target.value)} required />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Authenticating..." : "Unlock Gatekeeper"}
            </button>
          </form>
        </div>
      )}

      {isAuthenticated && (
        <div className={styles.dashboard}>
          <div className={styles.sessionBar}>
            <div className={styles.sessionLabel}>ACTIVE GATE CHECK-IN SESSION:</div>
            <div className={styles.sessionPills}>
              {["day1_am", "day1_pm", "day2_am", "day2_pm"].map((s) => (
                <button
                  key={s}
                  className={`${styles.sessionPill} ${activeSession === s ? styles.activePill : ""}`}
                  onClick={() => { setActiveSession(s as any); setCheckinSuccess(false); }}
                >
                  {s.includes("am") ? "🌅" : "🌙"} {SESSION_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.controlsCard}>
            <div className={styles.inputRow}>
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. MM26-79A7F0)"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verifyTokenOrId(ticketInput, false)}
              />
              <button onClick={() => verifyTokenOrId(ticketInput, false)} disabled={loading}>
                {loading ? "Searching..." : "Verify Ticket"}
              </button>
            </div>

            <div className={styles.scannerToggle}>
              <button onClick={toggleScanner}>
                📷 {isScanning ? "Stop Camera Scanner" : "Open Camera Scanner"}
              </button>
            </div>

            {isScanning && <div id="reader" className={styles.qrReaderBox}></div>}

            <div
              className={`${styles.dropzone} ${dragActive ? styles.dragActive : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropIcon}>📁 / 📋</div>
              <p className={styles.dropText}>Drag & Drop QR Image or Paste</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            </div>
            <div id="reader-hidden" style={{ display: "none" }}></div>
          </div>

          {checkinSuccess && (
            <div style={{ background: "rgba(46, 204, 113, 0.2)", border: "1px solid #2ecc71", color: "#2ecc71", padding: "0.8rem 1rem", borderRadius: "8px", textAlign: "center", marginBottom: "1rem" }}>
              🎉 Check-In Successful for <strong>{SESSION_LABELS[activeSession]}</strong>!
            </div>
          )}

          {error && <div className={styles.errorBanner}>{error}</div>}

          {student && (
            <div className={styles.resultCard}>
              {isCheckedInForActiveSession ? (
                <div className={`${styles.statusHeader} ${styles.checkedIn}`}>
                  ⚠️ ALREADY CHECKED IN FOR {SESSION_LABELS[activeSession]}
                </div>
              ) : (
                <div className={`${styles.statusHeader} ${styles.valid}`}>
                  ✅ VALID TICKET — ENTRY ALLOWED FOR {SESSION_LABELS[activeSession]}
                </div>
              )}

              <div className={styles.studentDetails}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}><div className={styles.label}>STUDENT NAME</div><div className={styles.value}>{student.name}</div></div>
                  <div className={styles.detailItem}><div className={styles.label}>TICKET ID</div><div className={styles.value}>{student.ticketId}</div></div>
                  <div className={styles.detailItem}><div className={styles.label}>COLLEGE</div><div className={styles.value}>{student.college}</div></div>
                  <div className={styles.detailItem}><div className={styles.label}>PAYMENT STATUS</div><div className={styles.value} style={{ color: "#2ecc71" }}>💳 {student.paymentStatus}</div></div>
                </div>

                <div className={styles.sessionMatrix}>
                  <div className={styles.matrixTitle}>4-SESSION CHECK-IN MATRIX</div>
                  <div className={styles.matrixGrid}>
                    {Object.keys(SESSION_LABELS).map((s) => (
                      <div key={s} className={`${styles.matrixCard} ${student.checkInSessions?.[s]?.checkedIn ? styles.matrixCheckedIn : ""}`}>
                        <div className={styles.matrixSessionName}>{SESSION_LABELS[s]}</div>
                        <div className={styles.matrixStatus}>{student.checkInSessions?.[s]?.checkedIn ? "🟢 Checked In" : "⚪ Pending"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.actionSection}>
                {!isCheckedInForActiveSession ? (
                  <button className={styles.checkinBtn} onClick={handleCheckin} disabled={loading}>
                    {loading ? "Processing..." : `CONFIRM ENTRY FOR ${SESSION_LABELS[activeSession]}`}
                  </button>
                ) : (
                  <div className={styles.timestampNotice}>
                    Checked in at: {currentSessionInfo?.timestamp ? new Date(currentSessionInfo.timestamp).toLocaleTimeString() : "Earlier"}
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
