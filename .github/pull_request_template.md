## What changed and why

## Checklist
- [ ] Ran `npm run lint` (not just `npm run build`) in every workspace touched
- [ ] Added a new external domain (fetch/script/style/frame)? -> added it to the CSP of every app that calls it, `connect-src` included
- [ ] Added/changed a Firestore query pattern? -> `firestore.rules` updated to match, not just client-side filtering
- [ ] Changed `firestore.rules`? -> copied byte-identically into BOTH `venkys/` and `venkys_admin/` (the `Firestore Rules Synced` check enforces this)
- [ ] Learned something non-obvious fixing this? -> updated `memory.md`

<!-- Merging into prod? Use the prod template instead: append
     ?expand=1&template=prod.md to the PR URL, or pick "prod" in the
     template chooser. It carries the release checklist CI enforces. -->
