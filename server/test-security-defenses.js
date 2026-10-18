// Exercise the production authentication and email code without loading .env,
// connecting to a provider, or sending any mail.
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const jwt = require("jsonwebtoken");
const { authenticateStaffRequest, isValidAdmin, issueStaffSession, timingSafeCompare } = require("./services/gatekeeperAuth");

const config = {
  ADMIN_KEY: "isolated-staff",
  ADMIN_SECRET: "isolated-staff-signing-secret",
  JWT_SECRET: "isolated-ticket-signing-secret-more-than-32-characters",
};
const bearer = token => ({ headers: { authorization: `Bearer ${token}` } });

test("The production credential check rejects malformed, oversized, and incorrect credentials", () => {
  assert.equal(isValidAdmin(config, config.ADMIN_KEY, config.ADMIN_SECRET), true);
  for (const secret of ["wrong", "", null, {}, "x".repeat(513)]) {
    assert.equal(isValidAdmin(config, config.ADMIN_KEY, secret), false);
  }
  assert.equal(isValidAdmin({}, config.ADMIN_KEY, config.ADMIN_SECRET), false);
  assert.equal(timingSafeCompare("short", "a much longer secret"), false);
});

test("Production staff sessions contain no password or signing key and have a four-hour expiry", () => {
  const session = issueStaffSession(config);
  const claims = jwt.decode(session.sessionToken);
  assert.equal(claims.exp - claims.iat, 4 * 60 * 60);
  assert.equal(claims.sub, config.ADMIN_KEY);
  assert.equal(claims.type, "gatekeeper-session");
  assert.equal(JSON.stringify(claims).includes(config.ADMIN_SECRET), false);
  assert.equal(JSON.stringify(claims).includes(config.JWT_SECRET), false);
  assert.equal(authenticateStaffRequest(config, bearer(session.sessionToken)), config.ADMIN_KEY);
});

test("Expired staff sessions fail verification in the actual JWT authentication code", context => {
  const session = issueStaffSession(config);
  context.mock.timers.enable({ apis: ["Date"], now: session.sessionExpiresAt + 1000 });
  assert.equal(authenticateStaffRequest(config, bearer(session.sessionToken)), null);
});

test("A tampered bearer cannot fall back to a valid password in the request body", () => {
  const session = issueStaffSession(config);
  const parts = session.sessionToken.split(".");
  parts[2] = "invalidsignature";
  assert.equal(authenticateStaffRequest(config, {
    ...bearer(parts.join(".")), body: { adminKey: config.ADMIN_KEY, adminSecret: config.ADMIN_SECRET },
  }), null);
});

test("Staff-password rotation revokes sessions while retaining the entry-pass signing secret", () => {
  const session = issueStaffSession(config);
  const rotated = { ...config, ADMIN_SECRET: "another-isolated-staff-password" };
  assert.equal(authenticateStaffRequest(rotated, bearer(session.sessionToken)), null);
  assert.equal(rotated.JWT_SECRET, config.JWT_SECRET);
});

function isolatedEmailService() {
  const messages = [];
  const emailModule = { exports: {} };
  const emailFile = path.join(__dirname, "services", "email.js");
  const safeRequire = id => {
    if (id === "dotenv") return { config() {} };
    if (id === "nodemailer") return { createTransport: () => ({
      sendMail: async options => {
        messages.push(options);
        return { accepted: [options.to], messageId: "isolated-message" };
      },
    }) };
    if (id === "./registration") return require("./services/registration");
    return require(id);
  };
  vm.compileFunction(fs.readFileSync(emailFile, "utf8"), ["require", "module", "__dirname", "process", "console"], { filename: emailFile })(
    safeRequire, emailModule, path.dirname(emailFile),
    { env: { GMAIL_USER: "sender@example.invalid", GMAIL_APP_PASSWORD: "isolated-mail-secret" } },
    { log() {}, error() {} },
  );
  return { ...emailModule.exports, messages };
}

test("The actual mail service refuses malformed or multiple recipients before SMTP", async () => {
  const service = isolatedEmailService();
  for (const toEmail of ["<student@example.invalid>", "student@example.invalid,other", "student@example..invalid"]) {
    await assert.rejects(service.sendIdCardEmail({ toEmail }), { code: "INVALID_RECIPIENT" });
  }
  assert.equal(service.messages.length, 0);
});

test("The production email builder escapes student text and sends both PNG attachments", async () => {
  const service = isolatedEmailService();
  await service.sendIdCardEmail({
    toEmail: "student@example.invalid", studentName: "<img src=x onerror=alert(1)>",
    college: "College <script>alert(1)</script>", ticketId: "MM26-TEST-C0FFEE", paymentMode: "test",
    idCardBuffer: Buffer.from("isolated-pass"), qrBuffer: Buffer.from("isolated-qr"),
  });
  const mail = service.messages[0];
  assert.equal(mail.to, "student@example.invalid");
  assert.ok(mail.html.includes("&lt;img"));
  assert.equal(mail.html.includes("<script>alert"), false);
  assert.equal(mail.attachments.length, 2);
  assert.ok(mail.attachments.every(attachment => attachment.contentType === "image/png"));
  assert.match(mail.subject, /^\[TEST — NO CHARGE\]/);
});
