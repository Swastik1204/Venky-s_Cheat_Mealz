## Production Release Checklist

<!-- venkys-prod-checklist-start -->
### Critical Incident & Architecture Guards (Must all be checked for prod PRs)
<!-- "Rules Duplication" and "Pre-Push Validation" were dropped 2026-08-26:
     they're already independently proven by the required "Firestore Rules
     Synced" and "Lint & Build — Customer/Admin App" checks passing on this
     PR — a manual checkbox for something a machine already verified was
     pure theater. Only judgment-call items that CI can't mechanically
     verify from the diff stay here. -->
- [ ] **Customer Isolation**: Customer Firestore order queries strictly include `where('userId', '==', user.uid)` and rules forbid cross-customer list reads.
- [ ] **Webhook Idempotency**: Status transitions from `pending-payment` -> `placed` verify `order.status === 'pending-payment'` and staff push alerts check `!order.staffNotifiedAt`.
- [ ] **Hosting Split & CORS**: Vercel serves `/api/*` only (no frontend SPA rewrites). All API OPTIONS responses send `Access-Control-Max-Age: 86400`.
<!-- venkys-prod-checklist-end -->

### Description of Changes
<!-- Summarize what is being deployed to production -->
