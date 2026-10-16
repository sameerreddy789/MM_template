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
| Staff verification | Actual browser login succeeded against the local test backend without fixtures. Both the standalone emailed QR PNG and the full entry-pass PNG decoded and verified against the paid cloud ticket. A changed QR signature was also rejected during the earlier signature check. |
| Check-in | All four sessions are recorded on the actual test ticket. Day 2 Morning and Evening were confirmed through the browser, and the existing Day 1 history was preserved. A fresh lookup and direct Firestore readback confirmed all four flags, timestamps and staff IDs. Repeat requests for every session returned HTTP 400 / `ALREADY_CHECKED_IN` without changing history. Earlier simultaneous cloud requests admitted another session once, and an unknown session was rejected. |
| Fresh ticket matrix | Isolated routes and real emulator transactions confirm that every newly paid ticket saves all four unchecked session entries immediately. Older partial records are normalized without replacing existing history. |
| Cloud access control | Anonymous reads and writes against the test-registration collection returned HTTP 403 / `PERMISSION_DENIED`. The diagnostic probe was removed. |

The CSV, environment files, service-account credentials, provider message ID, participant details, and signed QR artifacts remain private and excluded from Git. Test passes use a distinct prefix, test signing secrets, test collection, and visible test labels; they are not valid for live event entry.

## Code validation

- Production TypeScript/Vite build passed.
- Targeted ESLint passed for the gatekeeper UI and canonical URL hook. The changed `App.tsx` was compared with its prior committed version: both retain the same two existing lint errors and one warning; this change adds no App lint findings. The build still reports its existing large-bundle warning.
- **31 isolated Express route checks** passed. They cover signature and amount validation, durable orders, test/live separation, email failures and retries, duplicate payment notifications, all four session fields, staff authentication, malformed IDs, concurrent check-ins, invalid sessions, and staff request limits.
- **7 Firestore emulator checks** passed using real local transactions and substituted gateway/email services, including persisted four-session defaults and denied browser reads/forged writes.
- Browser regressions passed for failed lookups clearing stale tickets, overlapping requests, session locking, correctly named success messages, duplicate error codes, legacy QR links, awaited image verification, malformed input, late responses after logout, expired credentials, camera denial and startup cancellation.
- The gatekeeper login and scanner fit **360×800** without horizontal scrolling; desktop inspection passed at **1262×800**. Labels are associated with their fields, all four session cards are present, and browser JavaScript errors were empty. The UI detector returned no findings.
- The earlier registration-form check passed at **390×844**. Synthetic regression fixtures were confined to their separate localhost browser. The actual sandbox checkout, email attachments, staff login and four-session cloud checks used the real services.

The wider checks reproduced and fixed missing saved session defaults, stale results after failed verification, requests that could overlap, incorrect session success labels, and non-transactional check-in races. Staff scans use an operational limit separate from the strict login limit. Private QR paths are excluded from application analytics and canonical URLs.

Camera recovery checks used a local substitute. Actual uploaded PNG decoding and cloud verification passed; physical camera hardware was not tested.

## Scope and remaining deployment steps

This confirms the local test payment → cloud registration → ticket/QR → actual Gmail delivery path. No live payment or paid infrastructure was enabled. Firebase Cloud Functions and Render cron jobs were not used.

Real Razorpay webhook delivery to a public backend was not part of this localhost trial. Production needs matching live credentials, the public webhook and Dashboard secret, and the intended production signing/staff configuration. Render Free blocks Gmail SMTP; use the separate trusted-machine Gmail queue sender in external email mode there. Its computer/process must remain online, and provider/free database quotas still apply.

The repository's deny-all browser Firestore rules were validated in the emulator. This task checked the current cloud policy's test-collection behavior without changing the deployed rules or claiming that the repository file had been deployed.
