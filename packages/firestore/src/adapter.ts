import type { Firestore, Transaction, CollectionReference, Query } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import { createAdapterFactory } from "better-auth/adapters";
import type { CleanedWhere, CustomAdapter } from "better-auth/adapters";
import type { BetterAuthOptions } from "better-auth";
import type { FirestoreAdapterConfig, CollectionNames } from "./types.js";
import {
  createFieldMapper,
  resolveCollections,
  getCollectionRef,
  docToRecord,
  recordToDoc,
  getIdFromWhere,
  getIdsFromWhere,
  hasOrConnector,
  applyWhereClause,
  matchesAllClientFilters,
  batchDelete,
  batchUpdate,
  type FieldMapper,
} from "./utils.js";

async function findManyWithOr(
  collRef: CollectionReference,
  where: CleanedWhere[],
  mapper: FieldMapper,
  opts: {
    limit: number;
    select?: string[];
    sortBy?: { field: string; direction: "asc" | "desc" };
    offset?: number;
  },
  transaction?: Transaction,
): Promise<Record<string, unknown>[]> {
  const groups: CleanedWhere[][] = [[]];
  for (const clause of where) {
    if (clause.connector === "OR" && groups[groups.length - 1].length > 0) {
      groups.push([]);
    }
    groups[groups.length - 1].push(clause);
  }

  const merged = new Map<string, Record<string, unknown>>();

  for (const group of groups) {
    const idClause = group.find(
      (w) => w.field === "id" && w.operator === "eq",
    );
    if (idClause) {
      const ref = collRef.doc(String(idClause.value));
      const snap = transaction ? await transaction.get(ref) : await ref.get();
      if (snap.exists) {
        const record = docToRecord(snap.id, snap.data()!, mapper, opts.select);
        const otherFilters = group.filter((w) => w.field !== "id");
        if (otherFilters.length === 0 || matchesAllClientFilters(record, otherFilters)) {
          merged.set(snap.id, record);
        }
      }
      continue;
    }

    const { query, clientFilters } = applyWhereClause(collRef, group, mapper);
    const snap = transaction ? await transaction.get(query) : await query.get();

    for (const doc of snap.docs) {
      if (merged.has(doc.id)) continue;
      const record = docToRecord(doc.id, doc.data(), mapper, opts.select);
      if (clientFilters.length === 0 || matchesAllClientFilters(record, clientFilters)) {
        merged.set(doc.id, record);
      }
    }
  }

  let results = Array.from(merged.values());

  if (opts.sortBy) {
    const { field, direction } = opts.sortBy;
    results.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = aVal < bVal ? -1 : 1;
      return direction === "desc" ? -cmp : cmp;
    });
  }

  const start = opts.offset ?? 0;
  return results.slice(start, opts.limit ? start + opts.limit : undefined);
}

function createCustomAdapter(
  db: Firestore,
  collections: CollectionNames,
  mapper: FieldMapper,
  transaction?: Transaction,
): CustomAdapter {
  const col = (model: string) => getCollectionRef(db, model, collections);

  return {
    async create({ data, model }) {
      const collRef = col(model);
      const id = data.id ? String(data.id) : collRef.doc().id;
      const docRef = collRef.doc(id);
      const docData = recordToDoc(data, mapper);

      if (transaction) {
        transaction.set(docRef, docData);
        return { ...data, id } as any;
      }

      await docRef.set(docData);
      const snap = await docRef.get();
      return { id, ...docToRecord(id, snap.data() ?? {}, mapper) } as any;
    },

    async findOne({ model, where, select }) {
      const collRef = col(model);

      // Fast path: lookup by document ID
      const id = getIdFromWhere(where);
      if (id) {
        const docRef = collRef.doc(id);
        const snap = transaction
          ? await transaction.get(docRef)
          : await docRef.get();

        if (!snap.exists) return null;

        const record = docToRecord(snap.id, snap.data()!, mapper, select);
        const otherFilters = where.filter((w) => w.field !== "id");
        if (otherFilters.length > 0 && !matchesAllClientFilters(record, otherFilters)) {
          return null;
        }
        return record as any;
      }

      // Query path
      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);
      const finalQuery = query.limit(clientFilters.length > 0 ? 100 : 1);

      const snap = transaction
        ? await transaction.get(finalQuery)
        : await finalQuery.get();

      if (snap.empty) return null;

      for (const doc of snap.docs) {
        const record = docToRecord(doc.id, doc.data(), mapper, select);
        if (clientFilters.length === 0 || matchesAllClientFilters(record, clientFilters)) {
          return record as any;
        }
      }

      return null;
    },

    async findMany({ model, where, limit, select, sortBy, offset }) {
      const collRef = col(model);

      if (!where || where.length === 0) {
        let q: Query = collRef;
        if (sortBy) {
          q = q.orderBy(mapper.toFirestore(sortBy.field), sortBy.direction);
        }
        if (offset) q = q.offset(offset);
        if (limit) q = q.limit(limit);

        const snap = transaction ? await transaction.get(q) : await q.get();
        return snap.docs.map(
          (doc) => docToRecord(doc.id, doc.data(), mapper, select) as any,
        );
      }

      // Fast path: ID in [...]
      const ids = getIdsFromWhere(where);
      if (ids) {
        const docs = await Promise.all(
          ids.map((id) => {
            const ref = collRef.doc(id);
            return transaction ? transaction.get(ref) : ref.get();
          }),
        );
        const otherFilters = where.filter((w) => w.field !== "id");
        return docs
          .filter((snap) => snap.exists)
          .map((snap) => docToRecord(snap.id, snap.data()!, mapper, select))
          .filter((r) =>
            otherFilters.length === 0 || matchesAllClientFilters(r, otherFilters),
          )
          .slice(offset ?? 0, limit ? (offset ?? 0) + limit : undefined) as any[];
      }

      // Fast path: single ID eq
      const singleId = getIdFromWhere(where);
      if (singleId) {
        const ref = collRef.doc(singleId);
        const snap = transaction ? await transaction.get(ref) : await ref.get();
        if (!snap.exists) return [];
        const record = docToRecord(snap.id, snap.data()!, mapper, select);
        const otherFilters = where.filter((w) => w.field !== "id");
        if (otherFilters.length > 0 && !matchesAllClientFilters(record, otherFilters)) {
          return [];
        }
        return [record as any];
      }

      // OR connector: run separate queries and merge
      if (hasOrConnector(where)) {
        return findManyWithOr(collRef, where, mapper, { limit, select, sortBy, offset }, transaction) as any;
      }

      // Standard query path
      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);
      let q: Query = query;

      const needsClientSideProcessing = clientFilters.length > 0;

      if (sortBy) {
        q = q.orderBy(mapper.toFirestore(sortBy.field), sortBy.direction);
      } else if (offset && !needsClientSideProcessing) {
        q = q.orderBy(FieldPath.documentId());
      }

      if (!needsClientSideProcessing) {
        if (offset) q = q.offset(offset);
        if (limit) q = q.limit(limit);
      }

      const snap = transaction ? await transaction.get(q) : await q.get();

      let results = snap.docs.map(
        (doc) => docToRecord(doc.id, doc.data(), mapper, select),
      );

      if (needsClientSideProcessing) {
        results = results.filter((r) => matchesAllClientFilters(r, clientFilters));
        const start = offset ?? 0;
        results = results.slice(start, limit ? start + limit : undefined);
      }

      return results as any[];
    },

    async update({ model, where, update }) {
      const collRef = col(model);
      const updateData = recordToDoc(update as Record<string, unknown>, mapper);

      // Fast path: by ID
      const id = getIdFromWhere(where);
      if (id) {
        const docRef = collRef.doc(id);
        const snap = transaction ? await transaction.get(docRef) : await docRef.get();
        if (!snap.exists) return null;

        if (transaction) {
          transaction.update(docRef, updateData);
        } else {
          await docRef.update(updateData);
        }

        const updated = transaction
          ? { ...snap.data(), ...updateData }
          : (await docRef.get()).data();

        return docToRecord(id, updated ?? {}, mapper) as any;
      }

      // Query path
      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);
      const snap = transaction
        ? await transaction.get(query.limit(clientFilters.length > 0 ? 100 : 1))
        : await query.limit(clientFilters.length > 0 ? 100 : 1).get();

      if (snap.empty) return null;

      for (const doc of snap.docs) {
        const record = docToRecord(doc.id, doc.data(), mapper);
        if (clientFilters.length > 0 && !matchesAllClientFilters(record, clientFilters)) {
          continue;
        }

        if (transaction) {
          transaction.update(doc.ref, updateData);
          return docToRecord(doc.id, { ...doc.data(), ...updateData }, mapper) as any;
        }

        await doc.ref.update(updateData);
        const updatedSnap = await doc.ref.get();
        return docToRecord(doc.id, updatedSnap.data() ?? {}, mapper) as any;
      }

      return null;
    },

    async updateMany({ model, where, update }) {
      const collRef = col(model);
      const updateData = recordToDoc(update, mapper);

      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);
      const snap = await query.get();

      let docs = snap.docs;
      if (clientFilters.length > 0) {
        docs = docs.filter((doc) =>
          matchesAllClientFilters(docToRecord(doc.id, doc.data(), mapper), clientFilters),
        );
      }

      if (docs.length === 0) return 0;

      return batchUpdate(
        db,
        docs.map((d) => d.ref),
        updateData,
      );
    },

    async delete({ model, where }) {
      const collRef = col(model);

      // Fast path: by ID
      const id = getIdFromWhere(where);
      if (id) {
        const docRef = collRef.doc(id);
        if (transaction) {
          transaction.delete(docRef);
        } else {
          await docRef.delete();
        }
        return;
      }

      // Query path
      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);
      const snap = transaction
        ? await transaction.get(query.limit(clientFilters.length > 0 ? 100 : 1))
        : await query.limit(clientFilters.length > 0 ? 100 : 1).get();

      if (snap.empty) return;

      for (const doc of snap.docs) {
        if (clientFilters.length > 0) {
          const record = docToRecord(doc.id, doc.data(), mapper);
          if (!matchesAllClientFilters(record, clientFilters)) continue;
        }

        if (transaction) {
          transaction.delete(doc.ref);
        } else {
          await doc.ref.delete();
        }
        return;
      }
    },

    async deleteMany({ model, where }) {
      const collRef = col(model);

      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);
      const snap = await query.get();

      let docs = snap.docs;
      if (clientFilters.length > 0) {
        docs = docs.filter((doc) =>
          matchesAllClientFilters(docToRecord(doc.id, doc.data(), mapper), clientFilters),
        );
      }

      if (docs.length === 0) return 0;

      return batchDelete(
        db,
        docs.map((d) => d.ref),
      );
    },

    async count({ model, where }) {
      const collRef = col(model);

      if (!where || where.length === 0) {
        const snap = await collRef.count().get();
        return snap.data().count;
      }

      // Fast path: single ID
      const id = getIdFromWhere(where);
      if (id) {
        const docRef = collRef.doc(id);
        const snap = await docRef.get();
        return snap.exists ? 1 : 0;
      }

      // Fast path: ID in [...]
      const ids = getIdsFromWhere(where);
      if (ids) {
        const docs = await Promise.all(ids.map((i) => collRef.doc(i).get()));
        return docs.filter((d) => d.exists).length;
      }

      const { query, clientFilters } = applyWhereClause(collRef, where, mapper);

      if (clientFilters.length === 0) {
        const snap = await query.count().get();
        return snap.data().count;
      }

      // Client-side count
      const snap = await query.get();
      return snap.docs.filter((doc) =>
        matchesAllClientFilters(docToRecord(doc.id, doc.data(), mapper), clientFilters),
      ).length;
    },
  };
}

/**
 * Firestore adapter for better-auth.
 *
 * @example
 * ```ts
 * import { betterAuth } from "better-auth";
 * import { firestoreAdapter } from "@please-auth/firestore";
 * import { getFirestore } from "firebase-admin/firestore";
 *
 * const auth = betterAuth({
 *   database: firestoreAdapter({ db: getFirestore() }),
 * });
 * ```
 */
export function firestoreAdapter(config: FirestoreAdapterConfig = {}): ReturnType<typeof createAdapterFactory> {
  const {
    db,
    namingStrategy = "default",
    collections: collectionsOverride,
    debugLogs = false,
  } = config;

  if (!db) {
    throw new Error(
      "firestoreAdapter: `db` (Firestore instance) is required. " +
        "Pass getFirestore() from firebase-admin/firestore.",
    );
  }

  const mapper = createFieldMapper(namingStrategy);
  const collections = resolveCollections(namingStrategy, collectionsOverride);

  return createAdapterFactory({
    config: {
      adapterId: "firestore-adapter",
      adapterName: "Firestore Adapter",
      debugLogs,
      supportsJSON: true,
      supportsDates: true,
      supportsBooleans: true,
      supportsNumericIds: false,
      transaction: async (cb) => {
        return db.runTransaction(async (txn) => {
          const txAdapter = createAdapterFactory({
            config: {
              adapterId: "firestore-adapter",
              adapterName: "Firestore Adapter (Transaction)",
              supportsJSON: true,
              supportsDates: true,
              supportsBooleans: true,
              supportsNumericIds: false,
              transaction: false,
            },
            adapter: () => createCustomAdapter(db, collections, mapper, txn),
          });
          return cb(txAdapter as any);
        });
      },
    },
    adapter: () => createCustomAdapter(db, collections, mapper),
  });
}
