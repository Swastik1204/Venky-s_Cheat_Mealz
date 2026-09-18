# Venky's Cheat Mealz - Agent & Developer Guide

See [memory.md](file:///d:/My%20projects/Venky's_Cheat_Mealz/memory.md) for full project memory, RBAC model, architecture split, and incident gotchas.

## Core Commands
* **Lint Both Workspaces**: `cd venkys; npm run lint; cd ../venkys_admin; npm run lint`
* **Build Both Workspaces**: `cd venkys; npm run build; cd ../venkys_admin; npm run build`
* **Deploy Firestore Rules**: `firebase login:use venkysdgp@gmail.com; firebase deploy --only firestore:rules --project venky-s-chicken-xperience`

## Key Architecture Constraints
1. **Never break RBAC**: 6 tiers (Super Admin, Admin, Staff with granular page perms, Delivery, Customer, Guest).
2. **Synchronized Rules**: `venkys/firestore.rules` and `venkys_admin/firestore.rules` must remain identical.
3. **Idempotent Webhooks**: All payment webhooks must check `order.status === 'pending-payment'` and `!order.staffNotifiedAt`.
4. **Owner Isolation**: Customer order reads/lists strictly require `userId == request.auth.uid`.


## Commit body verification requirement (high-risk changes)

Any commit touching payment paths, auth, security headers, RBAC, or architecture-level infrastructure (CSP / CORS / hosting / deploy config / API routing) MUST have a commit body, not just a title, stating:
- **What was verified**: the specific behaviours checked.
- **How**: real evidence (test output, actual request/response status codes, before/after numbers, a live deployed check). "Should work", "build passes", or restating the diff does not count.
- **Known limitations**: what was NOT verified and why.

A one-line title with an empty body is not acceptable for this category, whichever agent or session produces it. Full rationale: `../memory/wiki/commit-body-verification-evidence.md`.
