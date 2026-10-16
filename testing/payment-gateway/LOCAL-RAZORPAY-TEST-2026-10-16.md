# Razorpay Test Mode local verification — 16 October 2026

The user completed a genuine Razorpay sandbox checkout through the website's existing five-field registration form. The gateway, cloud Firestore, and official Gmail sender were real services for this trial. Test Mode simulated the ₹1,000 fee without debiting real money.

## Verified results

| Check | Evidence |
| --- | --- |
| Private credential import | The dashboard CSV was validated as a test key pair, imported into ignored `server/.env.payment-test`, and refused by the live-mode guard if mismatched. Existing `server/.env` was preserved. |
| Gateway authentication | Actual Razorpay Test Mode API returned HTTP 200. |
| Checkout | The real Razorpay SDK opened a server-created order and displayed Test Mode. The user reported **Test registration confirmed**. |
| Payment | Actual payment API returned `captured: true`, status `captured`, amount `100000`, currency `INR`, matching order ID, and no refund. The order API returned `paid` and `amount_paid: 100000`. |
| Cloud records | The order's paid mapping and exactly one test ticket were confirmed in Firestore. Records were confined to `testRegistrationOrders` and `testRegistrations`. |
| Gmail authentication | The official mailbox authenticated successfully over SMTP. |
| Email delivery | The actual sender logged provider acceptance with two PNG attachments. Firestore recorded `emailStatus: Sent`, a provider message ID, and a sent timestamp. The recipient confirmed **Received the email and both attachments**. |
| Pass and QR | The saved ticket's pass and standalone QR were regenerated with the same services, decoded successfully with ZXing, and verified as HS256 tokens matching the test mode, ticket ID, and private stored token. No token or attachment was published. |
| Staff verification | The actual local staff login and paid-QR verification succeeded. A changed QR signature was rejected. |
| Check-in | A test-session check-in succeeded and a repeated scan was rejected. After the transaction fix, two simultaneous real cloud check-ins for another session returned one HTTP 200 and one HTTP 400. An unknown session was rejected. |
| Cloud access control | Anonymous reads and writes against the test-registration collection returned HTTP 403 / `PERMISSION_DENIED`. The diagnostic probe was removed. |

The CSV, environment files, service-account credentials, provider message ID, participant details, and signed QR artifacts remain private and excluded from Git. Test passes use a distinct prefix, test signing secrets, test collection, and visible test labels; they are not valid for live event entry.

## Code validation

- Production TypeScript/Vite build passed.
- Targeted ESLint passed for registration API, registration form, and gatekeeper UI.
- **27 isolated Express route checks** cover signature and amount validation, durable orders, test/live separation, email failures and retries, duplicate payment notifications, concurrent check-ins, invalid sessions, and staff request limits.
- **7 Firestore emulator checks** passed using real local transactions and substituted gateway/email services.
- Mobile form layout passed at **390×844**: all five required fields and the Test Mode notice were present, the enabled payment button was reachable by scrolling, document width matched the viewport, and the browser reported no JavaScript errors. Automatic QR-link selection was checked in a separate browser using its explicit isolated fixture; the user's payment browser used the real gateway and backend.

The wider checks reproduced and fixed non-transactional check-in races: duplicate admission within one session and lost updates across different sessions. Invalid session names were also accepted before the fix. Staff scans now have an operational rate limit separate from the strict login limit.

## Scope and remaining deployment steps

This confirms the local test payment → cloud registration → ticket/QR → actual Gmail delivery path. No live payment or paid infrastructure was enabled. Firebase Cloud Functions and Render cron jobs were not used.

Real Razorpay webhook delivery to a public backend was not part of this localhost trial. Production needs matching live credentials, the public webhook and Dashboard secret, and the intended production signing/staff configuration. Render Free blocks Gmail SMTP; use the separate trusted-machine Gmail queue sender in external email mode there. Its computer/process must remain online, and provider/free database quotas still apply.

The repository's deny-all browser Firestore rules were validated in the emulator. This task checked the current cloud policy's test-collection behavior without changing the deployed rules or claiming that the repository file had been deployed.
