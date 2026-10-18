const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const { RegistrationError, isConfiguredSecret } = require("./registration");

const SESSION_SECONDS = 4 * 60 * 60;
const SESSION_ISSUER = "mohanamantra-gatekeeper";
const SESSION_AUDIENCE = "mohanamantra-staff";

function timingSafeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  return crypto.timingSafeEqual(
    crypto.createHash("sha256").update(a).digest(),
    crypto.createHash("sha256").update(b).digest(),
  );
}

function isValidAdmin(config, adminKey, adminSecret) {
  if (!config.ADMIN_KEY || !config.ADMIN_SECRET || typeof adminKey !== "string" ||
    typeof adminSecret !== "string" || adminKey.length > 128 || adminSecret.length > 512) return false;
  const keyMatches = timingSafeCompare(adminKey, config.ADMIN_KEY);
  const secretMatches = timingSafeCompare(adminSecret, config.ADMIN_SECRET);
  return keyMatches && secretMatches;
}

function sessionSigningKey(config) {
  if (!isConfiguredSecret(config.JWT_SECRET, 32) || !config.ADMIN_KEY || !config.ADMIN_SECRET) {
    throw new RegistrationError(503, "STAFF_AUTH_UNAVAILABLE", "Staff sign-in is temporarily unavailable.");
  }
  // Separate staff sessions from entry-pass signatures. Changing the staff
  // password revokes these sessions without invalidating issued entry passes.
  return crypto.createHmac("sha256", config.JWT_SECRET)
    .update(`mm26:staff-session:v1\0${config.ADMIN_KEY}\0${config.ADMIN_SECRET}`).digest();
}

function issueStaffSession(config) {
  const sessionToken = jwt.sign({ type: "gatekeeper-session" }, sessionSigningKey(config), {
    algorithm: "HS256", subject: config.ADMIN_KEY,
    issuer: SESSION_ISSUER, audience: SESSION_AUDIENCE,
    expiresIn: SESSION_SECONDS, jwtid: crypto.randomUUID(),
  });
  return { sessionToken, sessionExpiresAt: jwt.decode(sessionToken).exp * 1000 };
}

function authenticateStaffRequest(config, request) {
  const authorization = request.headers?.authorization;
  if (authorization !== undefined) {
    if (typeof authorization !== "string" || authorization.length > 2048 ||
      !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/i.test(authorization)) return null;
    try {
      const session = jwt.verify(authorization.slice(7), sessionSigningKey(config), {
        algorithms: ["HS256"], issuer: SESSION_ISSUER, audience: SESSION_AUDIENCE,
      });
      return session.type === "gatekeeper-session" && session.sub === config.ADMIN_KEY ? session.sub : null;
    } catch { return null; }
  }
  // Previously loaded gatekeeper pages and existing staff scripts remain
  // compatible. Their failed credential attempts use the same strict limiter.
  return isValidAdmin(config, request.body?.adminKey, request.body?.adminSecret) ? config.ADMIN_KEY : null;
}

module.exports = { authenticateStaffRequest, isValidAdmin, issueStaffSession, timingSafeCompare };
