## What changed and why

<!-- A prod push ships both Firebase Hosting sites (`venkys-customer`, `venkys-admin`) and Firestore rules/indexes in one atomic deploy. -->

## Prod release checklist — required, do not remove the markers below

Every box must be ticked before this PR can merge. The **Prod PR Checklist**
CI job parses this exact section and fails the PR while anything is unticked —
see `.github/workflows/deploy.yml`. Tick honestly; a box ticked without
actually verifying it defeats the entire point of the gate.

<!-- prod-checklist:start -->
- [ ] **Customer isolation.** Customer Firestore order queries strictly include `where('userId', '==', user.uid)`, and rules forbid cross-customer list reads.
- [ ] **Webhook idempotency.** `pending-payment` -> `placed` transitions verify `order.status === 'pending-payment'`, and staff push alerts check `!order.staffNotifiedAt`.
- [ ] **Order binding intact.** The Razorpay order is resolved only from the server-stamped `notes.firestoreOrderId` fetched back from Razorpay — never from `paymentEntity.notes` or a client-supplied `orderNo`.
- [ ] **Hosting split & CORS.** Vercel serves `/api/*` only (no frontend SPA rewrites). All API `OPTIONS` responses send `Access-Control-Max-Age: 86400`.
- [ ] **Lint and build pass locally** in every workspace this PR touches — `npm run lint` as well as `npm run build`. A clean build has shipped a real regression before; the build alone is not proof.
- [ ] **No secret reached a client bundle.** If this PR adds or changes an env var or build output, grep the built `dist/` for `BEGIN PRIVATE KEY`, `client_email`, `RAZORPAY_KEY_SECRET`, `CLOUDINARY_API_SECRET`, `SMTP_PASS` — none present. Only `VITE_*` public config may ship client-side.
- [ ] **New external domain?** Every host this change talks to (fetch/XHR/script/style/frame) is in the CSP of every app that calls it — check `connect-src` specifically, not just `img-src`/`script-src`.
- [ ] **Firestore rules match the queries.** Any new or changed `.where()`/`.get()`/`.set()` has a matching rule, and no rule got broader than the UI needs. Remember `list` evaluates at the constraint level.
- [ ] **Firestore indexes file is in sync.** The deploy runs with `--force`, so an index live in the project but missing from the committed indexes file will be **deleted**. Confirm the file reflects every index production queries actually need.
- [ ] **Staging was actually checked.** `main` was verified on its staging surface before promoting to `prod` — not just "CI was green".
<!-- prod-checklist:end -->

## `--no-verify` bypass disclosure

<!-- If the local pre-push hook was bypassed with --no-verify for this push,
     say so here: what was skipped and why. Leave as "N/A" if it wasn't. -->

N/A

## Rollback plan

<!-- If this goes live and breaks something, what is the fastest way back? -->
