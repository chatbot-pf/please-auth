---
name: Firestore adapter fix patterns
description: Fix patterns and design decisions applied during PR review for the @please-auth/firestore adapter
type: project
---

Key fix decisions applied to this adapter:

1. **Fail-closed defaults**: `matchesClientFilter` default changed to `return false`; `applyOperator` default changed to `return null` (forces client-side). Unknown operators should never silently pass records.

2. **Transaction-aware bulk operations**: `updateMany`/`deleteMany` now check the `transaction` closure variable and use `transaction.update()`/`transaction.delete()` per-doc instead of `db.batch()` when inside a transaction.

3. **Batch partial-failure error enrichment**: `batchDelete`/`batchUpdate` wrap each `batch.commit()` in try-catch and throw an error with `committedCount` and `totalCount` properties.

4. **No re-read after create**: `create()` returns data directly using `docToRecord(id, docData, mapper)` instead of doing a redundant `docRef.get()` after `docRef.set()`.

5. **Custom model name warning**: `getCollectionRef` default case logs a `console.warn` for unknown model names before the passthrough, since better-auth plugins may use custom collections.

**Why:** These fixes reduce Firestore read costs, ensure correctness inside transactions, and make the adapter fail-closed rather than fail-open on unknown operators.
