const SESSION_NAMES = Object.freeze({
  day1_am: "Day 1 Morning",
  day1_pm: "Day 1 Evening",
  day2_am: "Day 2 Morning",
  day2_pm: "Day 2 Evening",
});

function createCheckInSessions() {
  return Object.fromEntries(Object.keys(SESSION_NAMES).map(key => [key,
    { checkedIn: false, timestamp: null, gatekeeper: null }]));
}

function normalizeCheckInSessions(stored) {
  const sessions = createCheckInSessions();
  for (const key of Object.keys(SESSION_NAMES)) {
    const session = stored?.[key];
    if (session && typeof session === "object") {
      sessions[key] = { checkedIn: session.checkedIn === true,
        timestamp: session.timestamp || null,
        gatekeeper: typeof session.gatekeeper === "string" ? session.gatekeeper : null };
    }
  }
  return sessions;
}

module.exports = { SESSION_NAMES, createCheckInSessions, normalizeCheckInSessions };
