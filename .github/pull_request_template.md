## Production Release Checklist

<!-- venkys-prod-checklist-start -->
### Critical Incident & Architecture Guards (Must all be checked for prod PRs)
- [ ] **Rules Duplication**: `venkys/firestore.rules` and `venkys_admin/firestore.rules` are 100% byte-for-byte identical (`npm run check-rules`).
- [ ] **Customer Isolation**: Customer Firestore order queries strictly include `where('userId', '==', user.uid)` and rules forbid cross-customer list reads.
- [ ] **Webhook Idempotency**: Status transitions from `pending-payment` -> `placed` verify `order.status === 'pending-payment'` and staff push alerts check `!order.staffNotifiedAt`.
- [ ] **Hosting Split & CORS**: Vercel serves `/api/*` only (no frontend SPA rewrites). All API OPTIONS responses send `Access-Control-Max-Age: 86400`.
- [ ] **Pre-Push Validation**: `npm run lint` and `npm run build` pass with 0 errors across both `venkys` and `venkys_admin`.
<!-- venkys-prod-checklist-end -->

### Description of Changes
<!-- Summarize what is being deployed to production -->
