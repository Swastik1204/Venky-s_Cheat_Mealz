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
