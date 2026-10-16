// Inject only into an owned localhost QA browser. Never import into the website.
// Every staff API call here is synthetic; real QR/cloud checks use another browser.
(() => {
  if (location.origin !== "http://localhost:5173") return;
  const key = "isolated-ui-test";
  const secret = "isolated-ui-test-secret";
  sessionStorage.setItem("mm26_admin_key", key);
  sessionStorage.setItem("mm26_admin_secret", secret);
  sessionStorage.setItem("mm26_admin_mode", "test");
  const originalFetch = window.fetch.bind(window);
  const sessionKeys = ["day1_am", "day1_pm", "day2_am", "day2_pm"];
  const pending = {};
  const state = window.__mmGatekeeperQA = {
    requests: 0, checkins: 0, logins: 0, token: "", origin: "",
    verifyBehavior: "success", checkinBehavior: "success",
    ignoreAbort: false, lastSession: "", holds: {},
    ticketId: "MM26-TEST-C0FFEE",
    sessions: Object.fromEntries(sessionKeys.map(session => [session, {
      checkedIn: false, timestamp: null, gatekeeper: null,
    }])),
    release(name) {
      if (!pending[name]) return false;
      pending[name]();
      return true;
    },
  };

  async function respond(name, body, status, signal) {
    const response = () => new Response(JSON.stringify(body), {
      status, headers: { "content-type": "application/json" },
    });
    if (state[name + "Behavior"] === "network") throw new TypeError("Isolated network failure");
    if (state[name + "Behavior"] !== "hold") return response();
    return new Promise((resolve, reject) => {
      const ignoreAbort = state.ignoreAbort;
      const cleanup = () => {
        delete pending[name];
        delete state.holds[name];
        signal?.removeEventListener("abort", abort);
      };
      const abort = () => {
        if (ignoreAbort) return;
        cleanup();
        reject(new DOMException("Isolated abort", "AbortError"));
      };
      state.holds[name] = true;
      pending[name] = () => { cleanup(); resolve(response()); };
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();
    });
  }

  window.fetch = async (input, options = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    const routes = ["/api/gatekeeper/login", "/api/gatekeeper/verify", "/api/gatekeeper/checkin"];
    if (url.origin !== location.origin || !routes.includes(url.pathname)) return originalFetch(input, options);
    const body = JSON.parse(options.body);
    const validAdmin = body.adminKey === key && body.adminSecret === secret;
    if (url.pathname.endsWith("/login")) {
      state.logins++;
      return respond("login", validAdmin
        ? { success: true, paymentMode: "test", adminKey: key }
        : { success: false, error: "Isolated invalid credentials" }, validAdmin ? 200 : 401, options.signal);
    }
    if (url.pathname.endsWith("/verify")) {
      state.requests++;
      state.token = body.token || "";
      state.origin = url.origin;
      if (!validAdmin || state.verifyBehavior === "unauthorized")
        return respond("verify", { success: false, error: "Isolated expired login" }, 401, options.signal);
      if (body.ticketId) state.ticketId = body.ticketId;
      return respond("verify", { success: true, student: {
        ticketId: state.ticketId, name: "Isolated Gatekeeper UI Test",
        college: "Local Test College", rollNo: "UI-TEST", email: "qa@example.invalid",
        phone: "9999999999", paymentStatus: "Paid", paymentMode: "test",
        checkInStatus: "Not Checked In", checkInSessions: structuredClone(state.sessions),
      } }, 200, options.signal);
    }
    state.checkins++;
    state.lastSession = body.sessionKey;
    if (!validAdmin) return respond("checkin", { success: false, error: "Isolated expired login" }, 401, options.signal);
    if (state.sessions[body.sessionKey]?.checkedIn) {
      return respond("checkin", {
        success: false, code: "ALREADY_CHECKED_IN", sessionKey: body.sessionKey,
        error: "Duplicate session. Entry was recorded earlier.",
        checkInSessions: structuredClone(state.sessions),
        checkedInAt: state.sessions[body.sessionKey].timestamp,
      }, 400, options.signal);
    }
    if (!sessionKeys.includes(body.sessionKey))
      return respond("checkin", { success: false, error: "Isolated invalid session" }, 400, options.signal);
    state.sessions[body.sessionKey] = {
      checkedIn: true, timestamp: "2026-10-16T10:30:00.000Z", gatekeeper: key,
    };
    return respond("checkin", {
      success: true, ticketId: body.ticketId, sessionKey: body.sessionKey,
      checkedInAt: state.sessions[body.sessionKey].timestamp,
      checkInSessions: structuredClone(state.sessions),
    }, 200, options.signal);
  };
})();
