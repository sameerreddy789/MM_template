// Inject only into an isolated localhost UI test browser. Never import into the
// website. Backend QR authenticity is checked separately with real saved passes.
(() => {
  if (location.origin !== "http://localhost:5173") return;
  sessionStorage.setItem("mm26_admin_key", "isolated-ui-test");
  sessionStorage.setItem("mm26_admin_secret", "isolated-ui-test-secret");
  const originalFetch = window.fetch.bind(window);
  const state = window.__mmGatekeeperQA = { requests: 0, token: "", origin: "" };
  window.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.origin === location.origin && url.pathname === "/api/gatekeeper/verify") {
      const body = JSON.parse(options.body);
      state.requests++;
      state.token = body.token;
      state.origin = url.origin;
      return new Response(JSON.stringify({ success: true, student: {
        ticketId: "MM26-TEST-C0FFEE", name: "Isolated Gatekeeper UI Test",
        college: "Local Test College", rollNo: "UI-TEST", email: "qa@example.invalid",
        phone: "9999999999", paymentStatus: "Paid", paymentMode: "test",
        checkInStatus: "Not Checked In", checkInSessions: {},
      } }), { status: 200, headers: { "content-type": "application/json" } });
    }
    return originalFetch(input, options);
  };
})();
