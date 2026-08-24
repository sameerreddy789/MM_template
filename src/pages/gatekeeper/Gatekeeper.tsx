import React, { useState, useEffect, useRef } from "react";
import styles from "./Gatekeeper.module.scss";
import { Html5Qrcode } from "html5-qrcode";

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
}

const Gatekeeper: React.FC = () => {
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

  // Smart Backend API fetcher (tries local backend first on localhost, then Render backend)
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

  // Check URL path or query params for token on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get("token");
    const pathParts = window.location.pathname.split("/");
    const pathToken = pathParts.includes("verify") ? pathParts[pathParts.indexOf("verify") + 1] : null;

    const tokenToVerify = queryToken || pathToken;

    if (tokenToVerify && isAuthenticated) {
      verifyTokenOrId(tokenToVerify, true);
    }
  }, [isAuthenticated]);

  // Handle Admin Key-Value Pair Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await fetchBackend("/api/gatekeeper/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey: inputKey, adminSecret: inputSecret }),
      });

      if (data && data.success) {
        sessionStorage.setItem("mm26_admin_key", inputKey);
        sessionStorage.setItem("mm26_admin_secret", inputSecret);
        setAdminKey(inputKey);
        setAdminSecret(inputSecret);
        setIsAuthenticated(true);
      } else {
        setError(data?.error || "Invalid Key-Value Pair Credentials!");
      }
    } catch (err: any) {
      setError("Failed to connect to backend server. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem("mm26_admin_key");
    sessionStorage.removeItem("mm26_admin_secret");
    setIsAuthenticated(false);
    setStudent(null);
    stopScanner();
  };

  // Verify Token or Ticket ID
  const verifyTokenOrId = async (queryValue: string, isToken = false) => {
    setError(null);
    setCheckinSuccess(false);
    setStudent(null);
    setLoading(true);

    try {
      const payload = isToken
        ? { token: queryValue, adminKey, adminSecret }
        : { ticketId: queryValue.trim(), adminKey, adminSecret };

      const data = await fetchBackend("/api/gatekeeper/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (data && data.success && data.student) {
        setStudent(data.student);
      } else {
        setError(data?.error || "Invalid ticket or registration not found.");
      }
    } catch (err: any) {
      setError("Network error while verifying ticket.");
    } finally {
      setLoading(false);
    }
  };

  // Perform Check-in
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
          adminKey,
          adminSecret,
        }),
      });

      if (data && data.success) {
        setCheckinSuccess(true);
        setStudent((prev) =>
          prev
            ? {
                ...prev,
                checkInStatus: "Checked In",
                checkedInAt: data.checkedInAt || new Date().toISOString(),
              }
            : null
        );
      } else if (data?.error?.includes("already checked in")) {
        setStudent((prev) =>
          prev
            ? {
                ...prev,
                checkInStatus: "Checked In",
                checkedInAt: data.checkedInAt || new Date().toISOString(),
              }
            : null
        );
        setError("⚠️ Student is already checked in!");
      } else {
        setError(data?.error || "Check-in failed.");
      }
    } catch (err: any) {
      setError("Failed to perform check-in.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle Camera Scanner
  const toggleScanner = async () => {
    if (isScanning) {
      await stopScanner();
    } else {
      startScanner();
    }
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
            console.log("Scanned QR:", decodedText);
            // If URL, extract token or query
            if (decodedText.includes("/gatekeeper/verify/")) {
              const token = decodedText.split("/gatekeeper/verify/")[1];
              verifyTokenOrId(token, true);
            } else if (decodedText.includes("token=")) {
              const urlParams = new URLSearchParams(decodedText.split("?")[1]);
              const token = urlParams.get("token");
              if (token) verifyTokenOrId(token, true);
            } else {
              // Direct ticket ID string
              verifyTokenOrId(decodedText, false);
            }
            stopScanner();
          },
          () => {}
        )
        .catch((err) => {
          console.error("Camera error:", err);
          setError("Could not access camera. Ensure camera permissions are allowed.");
          setIsScanning(false);
        });
    }, 200);
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error("Stop scanner error", e);
      }
    }
    setIsScanning(false);
  };

  // Drag & Drop and File Input State
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Process uploaded or pasted QR image file
  const processQRImageFile = async (file: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const html5QrCode = new Html5Qrcode("reader-hidden");
      const decodedText = await html5QrCode.scanFile(file, true);

      console.log("Decoded QR from file/paste:", decodedText);

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
    } catch (err: any) {
      console.error("QR File Decode Error:", err);
      setError("Could not read a valid QR Code from the image. Please ensure the QR image is clear and undamaged.");
    } finally {
      setLoading(false);
    }
  };

  // Clipboard Paste Event Listener (Ctrl + V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isAuthenticated) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processQRImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isAuthenticated]);

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processQRImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processQRImageFile(e.target.files[0]);
    }
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>MOHANA MANTRA 2K26</h1>
          <p>GATEKEEPER VERIFICATION PORTAL</p>
        </div>

        {isAuthenticated && (
          <div className={styles.adminBadge}>
            <span>🔑 Admin: <strong>{adminKey}</strong></span>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* LOGIN CARD */}
      {!isAuthenticated && (
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.lockIcon}>🔐</div>
            <h2>Admin Authentication</h2>
            <p>Enter your Key-Value credentials to access the gate scanner.</p>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>ADMIN KEY</label>
              <input
                type="text"
                placeholder="e.g. admin_gatekeeper"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>ADMIN SECRET</label>
              <input
                type="password"
                placeholder="Enter secret passkey"
                value={inputSecret}
                onChange={(e) => setInputSecret(e.target.value)}
                required
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Authenticating..." : "Unlock Gatekeeper"}
            </button>
          </form>
        </div>
      )}

      {/* VERIFICATION DASHBOARD */}
      {isAuthenticated && (
        <div className={styles.dashboard}>
          {/* CONTROLS */}
          <div className={styles.controlsCard}>
            <div className={styles.inputRow}>
              <input
                type="text"
                placeholder="Enter Ticket ID (e.g. MM26-A3F1B2)"
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

            {/* DRAG & DROP / COPY-PASTE DROPZONE */}
            <div
              className={`${styles.dropzone} ${dragActive ? styles.dragActive : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={styles.dropIcon}>📁 / 📋</div>
              <p className={styles.dropText}>
                Drag & Drop QR Image or Press <kbd style={{ background: "#2a1218", padding: "2px 6px", borderRadius: "4px", border: "1px solid #d4a843" }}>Ctrl + V</kbd> to Paste
              </p>
              <p className={styles.dropSubtext}>Click to browse and select an ID card or QR code image</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            {/* Hidden container for image QR code scanner */}
            <div id="reader-hidden" style={{ display: "none" }}></div>
          </div>

          {/* CHECK-IN SUCCESS ALERT */}
          {checkinSuccess && (
            <div style={{ background: "rgba(46, 204, 113, 0.2)", border: "1px solid #2ecc71", color: "#2ecc71", padding: "0.8rem 1rem", borderRadius: "8px", textAlign: "center", marginBottom: "1rem" }}>
              🎉 Check-In Successful! Student status updated in database.
            </div>
          )}

          {/* ERROR ALERT */}
          {error && <div className={styles.errorBanner}>{error}</div>}

          {/* STUDENT VERIFICATION CARD */}
          {student && (
            <div className={styles.resultCard}>
              {/* STATUS BANNER */}
              {student.checkInStatus === "Checked In" ? (
                <div className={`${styles.statusHeader} ${styles.checkedIn}`}>
                  ⚠️ ALREADY CHECKED IN
                </div>
              ) : (
                <div className={`${styles.statusHeader} ${styles.valid}`}>
                  ✅ VALID TICKET — ENTRY ALLOWED
                </div>
              )}

              {/* DETAILS */}
              <div className={styles.studentDetails}>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <div className={styles.label}>STUDENT NAME</div>
                    <div className={styles.value}>{student.name}</div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.label}>TICKET ID</div>
                    <div className={styles.value}>{student.ticketId}</div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.label}>COLLEGE</div>
                    <div className={styles.value}>{student.college}</div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.label}>ROLL NUMBER</div>
                    <div className={styles.value}>{student.rollNo}</div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.label}>PAYMENT STATUS</div>
                    <div className={styles.value} style={{ color: "#2ecc71" }}>
                      💳 {student.paymentStatus}
                    </div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.label}>CHECK-IN STATUS</div>
                    <div className={styles.value}>
                      {student.checkInStatus === "Checked In" ? "🟢 Checked In" : "⏳ Pending Gate Entry"}
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION SECTION */}
              <div className={styles.actionSection}>
                {student.checkInStatus !== "Checked In" ? (
                  <button
                    className={styles.checkinBtn}
                    onClick={handleCheckin}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "CONFIRM GATE ENTRY"}
                  </button>
                ) : (
                  <div className={styles.timestampNotice}>
                    Checked in at: {student.checkedInAt ? new Date(student.checkedInAt).toLocaleTimeString() : "Earlier today"}
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
