---
name: project_firestore_adapter
description: Firestore adapter for better-auth — architecture, security review findings, and key patterns
type: project
---

This is a new Firestore adapter package for the better-auth library (branch: amondnet/minsu-lee/add-firestore-adatper).

Key files:
- packages/firestore/src/adapter.ts — main adapter logic (CRUD operations)
- packages/firestore/src/utils.ts — where clause processing, field mapping, batch ops
- packages/firestore/src/firestore.ts — Firebase app init helper
- packages/firestore/src/types.ts — config types, snake_case field maps

**Why:** Adding Firestore as a supported database backend for better-auth.

**How to apply:** Security review was performed 2026-03-24. Key findings:

1. IMPORTANT: `updateMany` and `deleteMany` have no result limit on the initial Firestore query (query.get() without .limit()), allowing unbounded reads that can be weaponized for DoS if `where` clauses don't match at the Firestore layer and fall through to client-side filtering. See adapter.ts lines 301-302 and 361-362.

2. IMPORTANT: `getCollectionRef` falls through to `db.collection(model)` for unknown model names, meaning any unvalidated model name from the adapter interface is used directly as a Firestore collection path. See utils.ts line 84.

3. IMPORTANT (design): `findOne` with client-side filters fetches up to 100 docs from Firestore when clientFilters are present (adapter.ts line 141). No upper bound validation means large fetch windows on complex queries.

4. No hardcoded secrets or credentials found. Credential handling delegates entirely to Firebase Admin SDK (Application Default Credentials or explicit AppOptions).

5. The `matchesClientFilter` default case returns `true` (utils.ts line 288), meaning unknown operators silently allow all records through — a logic bypass if new operators are added to CleanedWhere without updating the switch.
