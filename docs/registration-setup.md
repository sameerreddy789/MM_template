# Website registration, Razorpay, and Firestore

Public `/register` currently shows **Registrations temporarily closed** while the live setup is being confirmed. It has no student form, fee or checkout control and makes no payment availability request. Local development retains the five-field form and separate Test Mode backend for further testing.

When registration is opened, students enter their name, email, mobile number, roll number, and college. The Express API creates a fixed **₹1,000 INR** Razorpay order and saves the details in Firestore before offering checkout. A Razorpay-hosted Payment Page link is not required for this flow.

## Opening and closing registration

Production builds stay closed unless `VITE_REGISTRATIONS_OPEN=true` is deliberately set before rebuilding. The backend separately requires `REGISTRATIONS_OPEN=true` for new live orders; deployed test mode also stays closed by default when `NODE_ENV=production`. Local test mode permits new orders when `REGISTRATIONS_OPEN` is absent. An explicit `REGISTRATIONS_OPEN=false` closes new orders in every environment.

Set both switches only after confirming the live merchant key pair, account activation/capture settings, genuine public webhook delivery and the production email sender. A frontend switch alone cannot open a closed backend. Closing registration blocks new orders before contacting Razorpay or writing student records, while signed confirmation requests and webhooks for existing paid orders continue to work.

## What each service does

| Service | Responsibility |
| --- | --- |
| Website | Collect details, open checkout, display the verified ticket and email status |
| Express API on the existing Render service | Keep secrets private, create orders, verify payment signatures and captured amounts, issue tickets |
| Firebase Firestore | Store pending orders, paid registrations, email status, and check-in records |
| Razorpay | Process payments and send signed payment notifications |
| Official Google mailbox / local JavaScript mail sender | Send entry passes from the paid-registration email queue |

Firebase's browser API key does not replace the payment backend. The backend uses Firebase Admin with a private service account. Firebase Cloud Functions are not used, and this change does not enable Blaze billing, paid hosting, a cron job, or any new subscription.

The setup can use the existing free Render service and Firestore's no-cost allowance. Render Free can still sleep after 15 minutes without inbound traffic; requests can take longer while it starts. The frontend allows up to 90 seconds for an API request and offers retries. This does not provide uninterrupted availability or unlimited database/email usage.

## Backend configuration

Copy `server/.env.example` to `server/.env` only if a private environment file does not already exist. Preserve existing settings and fill the missing values privately. Never put secret values in chat, source control, or frontend `VITE_` variables.

| Setting | Purpose |
| --- | --- |
| `RAZORPAY_KEY_ID` | Key ID for the merchant account and selected test/live mode |
| `PAYMENT_MODE` | Optional explicit `test`/`live` guard; the matching key prefix is used when omitted |
| `REGISTRATIONS_OPEN` | Explicit opening switch for new public orders; set `false` to close while preserving existing-payment recovery |
| `RAZORPAY_KEY_SECRET` | Matching private secret used for API authentication and checkout-proof verification |
| `RAZORPAY_WEBHOOK_SECRET` | Independent signing secret configured for the payment webhook |
| `JWT_SECRET` | Random secret of at least 32 characters used to sign QR passes |
| `FRONTEND_URL` | `http://localhost:5173` locally; the public festival URL in production |
| `TICKET_EMAIL_MODE` | `inline` for local backend SMTP, or `external` for the local email queue sender |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Official Google sender and app password, needed by this server only in inline mode |
| Firebase service account | Private Firebase Admin credentials for Firestore |
| `ADMIN_KEY`, `ADMIN_SECRET` | Staff-only gatekeeper access |

Use `server/serviceAccountKey.json` locally, a Render secret file at `/etc/secrets/serviceAccountKey.json`, or the private `FIREBASE_SERVICE_ACCOUNT` environment variable. These credentials are ignored by Git and must stay on trusted servers or the machine running the mailer.

`GET /api/registration-status` returns configuration booleans, the fixed fee, and a `ready` flag. It does not expose credentials or test a real payment, database write, or SMTP login. Missing/placeholder payment, webhook, and QR-signing secrets keep checkout disabled.

### Razorpay setup

For a real sandbox checkout, use a **matching test-mode key ID and secret**. A live key ID alone cannot create a valid server order. Do not replace an incomplete key pair with fabricated payment IDs or a browser-only success callback.

### Private local test environment

Export the test credentials from Razorpay as a CSV with `key_id` and `key_secret` columns and one credential row. Keep the export at the repository root as `rzp.csv` (ignored by Git) or inside the ignored `.secrets` directory. Never put it under `public/` or commit it.

From the repository root, run:

```powershell
node server/setup-payment-test.js
node server/check-payment-test.js
```

The setup command refuses live key pairs and creates the ignored `server/.env.payment-test`. It preserves the existing `server/.env`, copies the existing official Gmail settings, and generates separate test JWT, webhook, and staff secrets. It can also accept a CSV path as its first argument. Updating the export and running setup again preserves the test signing secrets so existing test passes remain verifiable.

The configuration check authenticates with the Razorpay Test Mode API and the actual Gmail transporter, and creates/reads/transacts/deletes one diagnostic Firestore test document. It does not make a payment, create a paid registration, or send an email. Its output contains status flags and error codes, never credential values.

Start the backend and frontend in separate terminals:

```powershell
npm --prefix server run dev:payment-test
npm run dev -- --host 127.0.0.1
```

Open `http://localhost:5173/register`, enter an email inbox you can check, and use **TRY TEST PAYMENT — ₹0 CHARGED**. Razorpay Test Mode simulates the ₹1,000 registration fee; no real money is debited. Netbanking opens a mock bank page where **Success** completes the sandbox payment. See [Razorpay's integration testing instructions](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/#2-test-integration).

Test orders use `testRegistrationOrders`; test tickets and their email queue use `testRegistrations`. Live mode retains `registrationOrders` and `registrations`. Test tickets use `MM26-TEST-XXXXXX`, and the form, receipt, email, and pass identify them as tests that are not valid for event entry. Browser recovery is separated by payment mode. Staff verification checks the record's mode, captured-payment status, signed QR mode, and private ticket token. A live gatekeeper does not look up test tickets.

The generated local webhook secret does not configure a Razorpay Dashboard webhook. Direct checkout confirmation works on localhost; genuine gateway webhook delivery still requires a reachable public test endpoint and a matching Dashboard secret. Keep production secrets separate when moving to live payments.

A real local sandbox checkout and Gmail delivery were completed on 16 October 2026; see [the verification report](../testing/payment-gateway/LOCAL-RAZORPAY-TEST-2026-10-16.md).

Configure a webhook for the backend's `/api/payment-webhook` endpoint, with `payment.captured` and `order.paid` events and the same private webhook signing secret. For the current backend URL, the production endpoint is:

```text
https://mohanamantra-backend.onrender.com/api/payment-webhook
```

Confirm automatic capture settings in Razorpay. An authorized payment stays pending until the gateway confirms capture. The API checks the server's stored order ID, the exact amount/currency, the captured payment, the paid order, and refund status before issuing a ticket. Order/ticket creation is transactional and repeated callbacks/webhooks reuse the same ticket.

Standard Checkout payments appear under **Payments** and **Orders** in the matching merchant account and Test/Live dashboard mode. A custom website registration is stored in Firestore; Razorpay receives the student details in the order's Notes (`student_name`, `student_email`, `student_phone`, `college_name`, `roll_no`) and the order receipt. This flow does not create a Razorpay-hosted Payment Page registration. If a captured payment is missing from the dashboard, search the exact payment/order ID with date and status filters cleared and confirm that the displayed merchant account issued the configured keys. An email alone is insufficient evidence of a provider payment; reconcile using the provider API and the saved paid-order mapping.

## Official Google email and the local mail sender

The official Google mailbox can be retained. The existing Node email service uses Gmail SMTP and can run locally with a valid app password. **Render Free blocks outbound ports 25, 465, and 587**, including the ports normally used by Gmail SMTP. A Python script using those ports on Render Free faces the same restriction. See [Render's free-service limitations](https://render.com/docs/free).

The existing automatic mailer is **JavaScript**, in `server/services/email.js`, using Nodemailer with Gmail SMTP. The Python files in this project process image assets. `server/server.js` calls the Gmail mailer after payment confirmation in inline mode.

To retain the official Google mailbox with Render Free, set **`TICKET_EMAIL_MODE=external` on the payment backend after preparing the local sender**. The backend then saves a paid ticket with `emailStatus: Pending`, acknowledges the durable payment webhook, and leaves delivery to the local sender. It does not attempt a second SMTP send. The website shows the paid ticket immediately and describes its email as pending until the sender records `Sent`.

On a trusted local machine, configure the existing Google sender/app password and Firebase service account in `server/.env`. Use the **same JWT signing secret as the backend** and set `FRONTEND_URL=https://www.mohanamantra.com` when sending production passes so QR links use the public website. Then start:

```powershell
node server/send-pending-emails.js
```

It checks the queue every 60 seconds and uses the existing ID-card, QR, and Gmail services. The computer and this process must stay running for automatic delivery. For one deliberate batch, use `node server/send-pending-emails.js --once`. Both commands send real emails. The separate queue consumer was verified with substituted delivery. The 16 October local checkout used the real inline Gmail sender, and the recipient confirmed receipt of both attachments.

The mailer must use private Firebase Admin access to consume the selected mode's registration collection with `paymentStatus: Paid` and `emailStatus: Pending` or `Failed`. Each record includes `ticketId`, student details, `secureToken`, payment details, mode, and email status. Generate the pass/QR using the existing server helpers or a compatible implementation. The QR token uses HS256 and the private ticket-signing secret; its payload contains `tid`, `name`, `stk`, and `mode`, and its URL is `/gatekeeper/verify/{token}` on the festival site. Existing live passes without an explicit mode remain supported. Staff opening a QR link select that pass automatically after authentication.

Claim each email transactionally before sending, using `emailStatus: Sending`, a unique `emailAttemptId`, and `emailLeaseUntil`. Record `Sent` only after the Google sender accepts the message; record `Failed` after a failed attempt. Never create a second ticket to retry email. A Gmail send followed by a process crash can still require reconciliation; SMTP delivery is not globally exactly-once.

The queue sender reads only pending/failed email records and expired sending leases, skips unpaid records, and uses the same transactional lease as the payment callback. It can recover after a temporary database outage. No new email-provider account is needed.

Gmail-accepted delivery records store `emailMessageId` and `emailSentAt`; failed attempts store a bounded failure code. Provider acceptance is separate from inbox receipt, which needs recipient confirmation. Check-in updates are Firestore transactions: simultaneous scans of one session admit the ticket once, and different-session scans preserve both updates. Only the four defined sessions are accepted. Staff login retains the strict brute-force limit; authenticated verification/check-in use a separate operational rate limit.

## Frontend configuration and local run

The frontend's `.env.example` contains only the public `VITE_BACKEND_URL`. Vite forwards development `/api` requests to `http://127.0.0.1:4000`, so local testing uses the local API. Production builds use `VITE_BACKEND_URL`; rebuild after changing it. The frontend receives the Razorpay key ID together with each server order and does not need a hosted-page URL.

Vite's development file denylist blocks the entire backend folder, credential exports, service-account files, `.secrets` folders and ignored `.local` artifacts. Git ignores alone do not stop a development server from serving a file by URL. The payment API proxy and normal website routes remain available; the trusted backend and local scripts still read their credentials from the filesystem.

Run the backend in one terminal:

```powershell
cd D:\MM_Website\MM_template\server
node --watch server.js
```

Run the website in another:

```powershell
cd D:\MM_Website\MM_template
npm run dev
```

Open `http://localhost:5173/register`. The five-field form remains visible when configuration is incomplete, and its disabled action says **Payments unavailable**. Refresh the availability check with **Try again** after correcting private backend configuration.

After checkout returns valid proof, the browser asks the API to verify it. Pending confirmation offers **Check payment status** and blocks another payment. Confirmation data is kept in this browser tab's session storage to support refresh/recovery without saving student details or server secrets. An incomplete checkout confirmation blocks another payment and directs the student to the registration team with the order ID.

## Staff verification and four-session check-in

The local staff portal is [http://localhost:5173/gatekeeper](http://localhost:5173/gatekeeper). With the private payment-test backend running, sign in using `ADMIN_KEY` and `ADMIN_SECRET` from ignored `server/.env.payment-test`. Keep the password private. Production uses the separately configured credentials on the deployed backend; the public route is [https://mohanamantra.com/gatekeeper](https://mohanamantra.com/gatekeeper).

The portal uses two deliberate steps:

1. Select Day 1 Morning, Day 1 Evening, Day 2 Morning, or Day 2 Evening, then scan the QR with the camera, upload/drop/paste a pass image, or enter its ticket ID or QR link.
2. Check the verified student details and select **Confirm entry** to save that session. Test Mode uses **Record test check-in** and displays that the pass is not valid for event entry.

A scan alone does not admit the student or write a check-in. Successful confirmation records `checkedIn: true`, an ISO timestamp, and the configured staff ID in the selected session. The history shows each session's time in India time and its admin ID. An already checked-in session disables its confirmation action; the server also rejects repeated or concurrent entry attempts atomically.

| Collection in Test Mode | What it stores |
| --- | --- |
| `testRegistrationOrders` | Form details, the server-created Razorpay order, pending/paid state, and the issued-ticket mapping |
| `testRegistrations` | The paid entry pass, email state, private QR token, and all four check-in sessions |

Live mode uses `registrationOrders` and `registrations`. Pending order records do not have a usable entry pass. Two collections preserve the payment record and the issued ticket separately; scanning reads the paid-ticket collection.

Every newly paid ticket saves all four entries immediately:

```json
{
  "checkInSessions": {
    "day1_am": { "checkedIn": false, "timestamp": null, "gatekeeper": null },
    "day1_pm": { "checkedIn": false, "timestamp": null, "gatekeeper": null },
    "day2_am": { "checkedIn": false, "timestamp": null, "gatekeeper": null },
    "day2_pm": { "checkedIn": false, "timestamp": null, "gatekeeper": null }
  }
}
```

Older partial records receive defaults when verified; the next successful check-in persists the complete matrix while preserving existing session history. A general `checkInStatus: Checked In` means at least one session was recorded. Each later session remains independently eligible until its own flag is set.

A new verification clears the previous student's result. Session, ticket, camera and image controls remain locked through verification/check-in, including image decoding. Logout cancels pending requests and camera startup; expired credentials return to sign-in. Ticket IDs and signed-token links use the same parser across input methods. Private QR routes are excluded from the application's analytics calls and use a canonical URL without the token.

Both actual emailed PNG attachments were decoded in the browser and verified against the existing cloud test ticket. All four sessions and duplicate rejection were then confirmed by direct Firestore readback. Physical camera hardware was not exercised; camera permission failure and startup cancellation were tested separately with a local substitute.

## Safe local checks

With both local servers running, `node testing/payment-gateway/test-private-dev-files.js` checks denied HTTP access to private files, including raw and absolute filesystem URL forms, while confirming the registration/admin pages and API proxy remain reachable. It uses only read-only HTTP requests and a temporary ignored synthetic probe. Missing credential files are skipped; their contents are never loaded or fabricated.

The isolated route checks use the actual Express routes with substituted Razorpay, Firestore, QR/card generation, and email:

```powershell
node server/test-payment-flow.js
```

The following checks use real Firestore emulator transactions and the repository's rules with substituted payments/email. They require Java and a working Firebase CLI. The demo project and explicit loopback guard prevent production writes:

```powershell
npx --yes firebase-tools emulators:exec --only firestore --project demo-mohana-mantra --config firebase.json --non-interactive "node server/test-registration-firestore.js"
```

Browser QA can inject `testing/payment-gateway/browser-fixture.js` only into a separate local test browser. It substitutes checkout and all payment API calls on the localhost origin. It is never imported by the application.

`testing/payment-gateway/gatekeeper-fixture.js` tests staff login, QR/input parsing, held or failed requests, duplicate check-ins, and session state in an isolated browser with synthetic staff/session data. Both emailed PNG attachments and all four real check-ins were checked separately against the cloud test ticket. Neither fixture belongs in the browser used for the genuine Razorpay trial.

The legacy `test-full-pipeline.js` and `create-test002.js` manually fabricate payment fixtures. They now refuse cloud execution and require both the test environment and a loopback Firestore emulator. They cannot validate a real Razorpay payment. The standalone email/order diagnostics also require the separate test environment and never log credential prefixes.

`firestore.rules` denies browser reads/writes; only Firebase Admin can access the private collections. These rules were tested locally and **have not been deployed to Firebase**. Review current cloud rules and publish the intended rules as a separate deployment step before opening production registration.

The isolated route/emulator checks and browser fixtures do not perform a real Razorpay transaction, create a production Firestore registration, send a confirmation email, push to GitHub, or deploy the website. The separately verified genuine sandbox checkout and Gmail delivery are documented in the linked report.
