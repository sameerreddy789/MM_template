# Registration and gatekeeper security review

Review started on 17 October 2026 and completed on 18 October 2026. The scope includes the React website, the Express payment backend, Firestore access, Razorpay confirmation, the official Google mail sender, staff sessions, QR verification, deployment headers, and dependencies.

## Result

One high-confidence authentication weakness was reproduced and fixed. All 69 isolated regression/security tests pass. The frontend and backend dependency audits report zero known vulnerabilities. Semgrep reports zero findings and zero parsing errors in its scanned scope. Redacted Gitleaks scans of Git history, staged changes, and the production bundle report no secret leaks, subject to the one precisely scoped synthetic-test-token exception described below.

Live configuration and checkout readiness were checked without charging money. The first successful real payment still needs its captured payment, public webhook receipt, Firestore registration, and inbox delivery reconciled. Earlier successful Test Mode payments and receipt emails are useful evidence, but they do not complete that live confirmation.

## Confirmed finding and fix

### SEC-001: Credential guessing through direct staff endpoints — High

**Confidence:** High. **Affected code:** `server/server.js`. **Category:** CWE-307, insufficient restriction of authentication attempts.

An unauthenticated caller could send guessed staff credentials directly to ticket verification/check-in. Those requests used the much larger operational scanning allowance rather than the login failure budget. This made password guessing substantially easier, and successful guesses grant access to paid-ticket information and check-in operations.

The login, verification, and check-in routes now share a budget of ten failed authentication attempts per IP address in fifteen minutes. Correctly authenticated staff bypass the failure budget and keep the separate allowance of 1,200 scanning requests per minute. This prevents a failed-login flood from locking out valid staff on shared event Wi-Fi. Tests exercise all three routes, proxy forwarding, valid staff after failed attempts, and alternate-case route handling.

## Additional changes

- The browser stores a four-hour staff bearer session instead of the staff password. It removes legacy saved credentials, clears the password after login, and handles refresh, expiry, and logout. The backend verifies the algorithm, issuer, audience, subject, and token type. Staff sessions use a distinct HMAC context derived from the existing configuration; changing the staff password revokes them while preserving issued ticket signatures. A bad bearer header cannot fall back to body credentials. Existing staff scripts remain compatible under the same authentication budget.
- Render trusts one application proxy; direct local servers ignore forwarded client-address headers. Production CORS accepts the exact festival and configured frontend origins. The API disables caching and framework-identifying headers, denies framing, returns bounded JSON errors, preserves raw bytes only for signed webhooks, and reduces personal-information logging.
- Registration and the Google mail service accept a single valid email recipient and reject display-address syntax, recipient lists, malformed domains, and overlong addresses before contacting the mail provider. Student values remain escaped in the actual email template.
- The website adds a Content Security Policy with explicit script origins and without script `unsafe-inline` or `unsafe-eval`. It also adds MIME-type protection, frame denial, a referrer policy, and a camera-only Permissions Policy. Gatekeeper responses are private/no-store, no-referrer, and noindex. Inline styles remain allowed for existing styling and provider compatibility.
- Unused browser Firebase and Google OAuth dependencies/code were removed. Firestore remains in the trusted backend. The QR library and gatekeeper page load on demand; the scanner loads only when camera or image scanning is requested. Direct registration/staff visits skip the general asset warmup, and staff routes skip public background music and door transitions.
- The GitHub security workflow uses read-only repository permissions, pinned action revisions, Node 22, locked installations, dependency audits, the production build, targeted frontend lint, all 69 tests, and checksum-verified Gitleaks scans of history and the build output. It does not need production credentials.

No additional hosting subscription, Firebase Cloud Functions, or email-provider account was introduced. Existing live/test database collections and ticket-signing keys remain separate. Public builds continue to reject Test Mode checkout; authenticated staff can verify existing demo passes.

## Verification

| Check | Result and scope |
| --- | --- |
| `node server/test-payment-flow.js` | 62 passing tests against the real Express routes with isolated provider, Firestore, and SMTP substitutes; no real charges, registrations, or emails |
| `node --test server/test-security-defenses.js` | Seven passing tests of the actual authentication and email modules, including expiry, tampering, password rotation, escaping, and both PNG attachments |
| Frontend dependency audit | Zero vulnerabilities after updates/removing unused dependencies; the baseline contained 17 high-severity dependency entries, not 17 demonstrated remote exploits |
| Backend dependency audit | Zero vulnerabilities |
| Production build, backend syntax, targeted frontend lint, diff whitespace | Passed |
| Semgrep 1.172.0 | Zero findings and zero errors; 180 files, 107 applied rules; four files over 1 MB skipped. New staff-session files were included |
| Gitleaks 8.30.1, Git history | 191 commits, approximately 106.46 MB scanned, zero findings after the synthetic-token exception |
| Gitleaks, staged changes | Approximately 44.64 KB scanned, zero findings before adding this report |
| Gitleaks, production bundle | Approximately 22.74 MB scanned, zero findings |
| Actual private-value comparison | 249 tracked/build files checked against configured private secrets and the Firebase private key; zero matches. Values were not printed |
| Anonymous Firestore REST reads | Existing test registration and unpaid live-order reads returned HTTP 403 `PERMISSION_DENIED` |
| Production-header localhost preview | Real updated backend staff login, manual ticket lookup, QR image decoding, session retention after refresh, and logout succeeded; no CSP warnings/errors observed during those operations |
| Demo ticket preservation | QR verification showed the existing four-session history and left both unused Day 2 sessions unchanged |
| Genuine live Razorpay API | Authenticated fetch of the existing unpaid ₹1,000 order succeeded; amount paid remained ₹0 |
| Razorpay browser checkout | The existing unpaid live order opened at ₹1,000 plus the displayed fee under the new CSP; no payment was submitted |
| Official Google sender | SMTP authentication succeeded; its live ticket-signing key matches Render and its QR links point to the public festival domain |

The localhost policy preview served production assets with the Vercel headers. Only the backend origin was replaced with a local proxy. Registration availability/order creation used a fixture referencing an existing genuine unpaid live order; staff verification used the updated real backend and existing Firestore test records. The preview could not submit payments. It created no new order, ticket, or check-in.

The Gitleaks exception applies only to `server/test-idcard.js` line 21 in historical commit `3e9a15f410a93c60a57f1543328cdaa4d6189e82`. The value was checked to be a synthetic token used to render a test card, not a provider credential or database record. No rule or directory was broadly excluded to hide findings. Windows scanner archive SHA-256: `d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e`. The workflow's Linux archive checksum was also checked against the release checksums.

## Initial-load measurements

Measured with the same production build command before and after the dependency/loading changes. Sizes use Vite's decimal kilobytes.

| Asset | Before | After |
| --- | ---: | ---: |
| Main JavaScript | 1,001.96 kB | 646.07 kB |
| Main JavaScript, gzip | 321.65 kB | 214.85 kB |
| Initially loaded public CSS | 164.12 kB | 153.85 kB |
| Deferred QR library | Included in main | 375.14 kB / 110.56 kB gzip |
| Deferred gatekeeper JavaScript | Included in main | 18.08 kB / 6.35 kB gzip |

The initial main JavaScript is approximately 35.5% smaller. Total JavaScript is slightly larger after dependency updates and splitting; the improvement is the amount downloaded initially. The main chunk still exceeds Vite's 500 kB advisory threshold. This is a build-size result, not a claim of measured mobile Core Web Vitals improvement.

## Operational limits and owner actions

1. Perform one deliberate real registration and reconcile its provider payment/order IDs, captured amount, stored paid ticket, received webhook event/time, and entry-pass email. A ready configuration endpoint or an email alone does not prove this complete chain. Retain the receipt and do not repeat payment if confirmation is pending.
2. Keep the trusted computer and `node server/send-pending-emails.js` running. Render's backend queues emails in external mode; the local worker performs delivery. The worker's current live queue was empty when checked. Gmail authentication and previous inbox confirmations are separate from the next real email's delivery confirmation.
3. Rotate provider credentials and staff passwords that were actually pasted into chat through their respective providers. This review found no match for the configured private values in tracked files or `dist`; chat exposure is a separate issue. Plan ticket-signing-key rotation carefully so issued passes remain verifiable.
4. Render Free can sleep, cold starts can delay requests, and the in-memory rate-limit counters reset on service restart. The frontend already allows retries and up to 90 seconds for API requests. This setup does not promise continuous availability, unlimited Firestore/Google email usage, or distributed rate-limit persistence.
5. SMTP provider acceptance is not guaranteed inbox delivery. Transactional email leases prevent routine duplicate sends, but an SMTP success followed by a worker crash can require reconciliation. A local worker outage leaves a confirmed registration's email pending.

Automated scans are evidence for the inspected code and configuration, not a guarantee of the absence of every vulnerability. Docker was unnecessary: the native scanners and real browser/API checks covered this task, and no public load test or destructive production scan was performed.

## References

- [OWASP Cheat Sheet Series](https://github.com/OWASP/CheatSheetSeries): authentication, session management, input validation, and data protection.
- [Node.js best practices](https://github.com/goldbergyoni/nodebestpractices): bounded errors, logging, dependency hygiene, and trusted proxy configuration.
- [Express rate-limit proxy guidance](https://express-rate-limit.mintlify.app/guides/troubleshooting-proxy-issues): client-address handling behind application proxies.
- [Gitleaks](https://github.com/gitleaks/gitleaks): redacted source/history/build secret scanning.
- [Render Free limits](https://render.com/docs/free): cold starts and outbound SMTP restrictions.
