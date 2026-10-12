# Website registration, Razorpay, and Firestore

Students register on `/register` using their name, email, mobile number, roll number, and college. The existing Express API creates a fixed **₹1,000 INR** Razorpay order and saves the student details in Firestore before offering checkout. A Razorpay-hosted Payment Page link is not required for this flow.

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

Configure a webhook for the backend's `/api/payment-webhook` endpoint, with `payment.captured` and `order.paid` events and the same private webhook signing secret. For the current backend URL, the production endpoint is:

```text
https://mohanamantra-backend.onrender.com/api/payment-webhook
```

Confirm automatic capture settings in Razorpay. An authorized payment stays pending until the gateway confirms capture. The API checks the server's stored order ID, the exact amount/currency, the captured payment, the paid order, and refund status before issuing a ticket. Order/ticket creation is transactional and repeated callbacks/webhooks reuse the same ticket.

## Official Google email and the local mail sender

The official Google mailbox can be retained. The existing Node email service uses Gmail SMTP and can run locally with a valid app password. **Render Free blocks outbound ports 25, 465, and 587**, including the ports normally used by Gmail SMTP. A Python script using those ports on Render Free faces the same restriction. See [Render's free-service limitations](https://render.com/docs/free).

The existing automatic mailer is **JavaScript**, in `server/services/email.js`, using Nodemailer with Gmail SMTP. The Python files in this project process image assets. `server/server.js` calls the Gmail mailer after payment confirmation in inline mode.

To retain the official Google mailbox with Render Free, set **`TICKET_EMAIL_MODE=external` on the payment backend after preparing the local sender**. The backend then saves a paid ticket with `emailStatus: Pending`, acknowledges the durable payment webhook, and leaves delivery to the local sender. It does not attempt a second SMTP send. The website shows the paid ticket immediately and describes its email as pending until the sender records `Sent`.

On a trusted local machine, configure the existing Google sender/app password and Firebase service account in `server/.env`. Use the **same JWT signing secret as the backend** and set `FRONTEND_URL=https://www.mohanamantra.com` when sending production passes so QR links use the public website. Then start:

```powershell
node server/send-pending-emails.js
```

It checks the queue every 60 seconds and uses the existing ID-card, QR, and Gmail services. The computer and this process must stay running for automatic delivery. For one deliberate batch, use `node server/send-pending-emails.js --once`. Both commands send real emails; they are not harmless diagnostic checks. The implementation was verified with substituted email delivery, and the real sender was not started during this change.

The mailer must use private Firebase Admin access to consume `registrations` documents with `paymentStatus: Paid` and `emailStatus: Pending` or `Failed`. Each record includes `ticketId`, student details, `secureToken`, payment details, and email status. Generate the pass/QR using the existing server helpers or a compatible implementation. The QR token uses HS256 and the private ticket-signing secret; its payload contains `tid`, `name`, and `stk`, and its URL is `/gatekeeper/verify/{token}` on the festival site.

Claim each email transactionally before sending, using `emailStatus: Sending`, a unique `emailAttemptId`, and `emailLeaseUntil`. Record `Sent` only after the Google sender accepts the message; record `Failed` after a failed attempt. Never create a second ticket to retry email. A Gmail send followed by a process crash can still require reconciliation; SMTP delivery is not globally exactly-once.

The queue sender reads only pending/failed email records and expired sending leases, skips unpaid records, and uses the same transactional lease as the payment callback. It can recover after a temporary database outage. No new email-provider account is needed.

## Frontend configuration and local run

The frontend's `.env.example` contains only the public `VITE_BACKEND_URL`. Vite forwards development `/api` requests to `http://127.0.0.1:4000`, so local testing uses the local API. Production builds use `VITE_BACKEND_URL`; rebuild after changing it. The frontend receives the Razorpay key ID together with each server order and does not need a hosted-page URL.

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

## Safe local checks

The isolated route checks use the actual Express routes with substituted Razorpay, Firestore, QR/card generation, and email:

```powershell
node server/test-payment-flow.js
```

The following checks use real Firestore emulator transactions and the repository's rules with substituted payments/email. They require Java and a working Firebase CLI. The demo project and explicit loopback guard prevent production writes:

```powershell
npx --yes firebase-tools emulators:exec --only firestore --project demo-mohana-mantra --config firebase.json --non-interactive "node server/test-registration-firestore.js"
```

Browser QA can inject `testing/payment-gateway/browser-fixture.js` only into a separate local test browser. It substitutes checkout and all payment API calls on the localhost origin. It is never imported by the application.

`firestore.rules` denies browser reads/writes; only Firebase Admin can access the private collections. These rules were tested locally and **have not been deployed to Firebase**. Review current cloud rules and publish the intended rules as a separate deployment step before opening production registration.

No real Razorpay transaction, production Firestore registration, confirmation email, GitHub push, or deployment is performed by these local checks.
