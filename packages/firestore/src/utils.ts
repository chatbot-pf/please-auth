import { Timestamp } from "firebase-admin/firestore";
import type {
  CollectionReference,
  DocumentReference,
  Query,
  Firestore,
  DocumentData,
} from "firebase-admin/firestore";
import type { CleanedWhere } from "better-auth/adapters";
import {
  SNAKE_CASE_FIELD_MAP,
  SNAKE_CASE_FIELD_REVERSE_MAP,
  DEFAULT_COLLECTIONS,
  type CollectionNames,
  type NamingStrategy,
} from "./types.js";

export type { CleanedWhere } from "better-auth/adapters";

/**
 * Convert Firestore Timestamps to JS Dates recursively.
 */
export function convertTimestamps(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate();
  if (Array.isArray(value)) return value.map(convertTimestamps);
  if (value !== null && typeof value === "object" && value.constructor === Object) {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      result[k] = convertTimestamps(v);
    }
    return result;
  }
  return value;
}

/**
 * Create field name mapper for a given naming strategy.
 */
export function createFieldMapper(strategy: NamingStrategy) {
  if (strategy === "default") {
    return {
      toFirestore: (field: string) => field,
      fromFirestore: (field: string) => field,
    };
  }
  return {
    toFirestore: (field: string) => SNAKE_CASE_FIELD_MAP[field] ?? field,
    fromFirestore: (field: string) => SNAKE_CASE_FIELD_REVERSE_MAP[field] ?? field,
  };
}

export type FieldMapper = ReturnType<typeof createFieldMapper>;

/**
 * Resolve collection names from config.
 */
export function resolveCollections(
  strategy: NamingStrategy,
  overrides?: Partial<CollectionNames>,
): CollectionNames {
  return { ...DEFAULT_COLLECTIONS, ...overrides };
}

/**
 * Get Firestore collection reference for a better-auth model name.
 */
export function getCollectionRef(
  db: Firestore,
  model: string,
  collections: CollectionNames,
): CollectionReference {
  const normalized = model.toLowerCase().replace(/s$/, "");
  switch (normalized) {
    case "user":
      return db.collection(collections.users);
    case "session":
      return db.collection(collections.sessions);
    case "account":
      return db.collection(collections.accounts);
    case "verification":
    case "verificationtoken":
      return db.collection(collections.verifications);
    default:
      return db.collection(model);
  }
}

/**
 * Document data from Firestore → better-auth format.
 */
export function docToRecord(
  id: string,
  data: DocumentData,
  mapper: FieldMapper,
  select?: string[],
): Record<string, unknown> {
  const converted = convertTimestamps(data) as Record<string, unknown>;
  const result: Record<string, unknown> = { id };

  for (const [key, value] of Object.entries(converted)) {
    const mappedKey = mapper.fromFirestore(key);
    if (select && !select.includes(mappedKey) && mappedKey !== "id") continue;
    result[mappedKey] = value;
  }

  return result;
}

/**
 * better-auth data → Firestore document data (strip id, map fields).
 */
export function recordToDoc(
  data: Record<string, unknown>,
  mapper: FieldMapper,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === "id") continue;
    result[mapper.toFirestore(key)] = value;
  }
  return result;
}

/**
 * Check if a where clause targets the document ID with eq operator.
 */
export function getIdFromWhere(where: CleanedWhere[]): string | null {
  const idClause = where.find(
    (w) => w.field === "id" && w.operator === "eq",
  );
  return idClause ? String(idClause.value) : null;
}

/**
 * Check if a where clause has an "in" operator on the id field.
 */
export function getIdsFromWhere(where: CleanedWhere[]): string[] | null {
  const idClause = where.find(
    (w) => w.field === "id" && w.operator === "in",
  );
  return idClause && Array.isArray(idClause.value)
    ? idClause.value.map(String)
    : null;
}

/**
 * Check if any where clause requires client-side filtering.
 */
export function needsClientFilter(where: CleanedWhere[]): boolean {
  return where.some(
    (w) =>
      w.operator === "not_in" ||
      w.operator === "ends_with" ||
      w.operator === "contains",
  );
}

/**
 * Check if any where clause uses OR connector.
 */
export function hasOrConnector(where: CleanedWhere[]): boolean {
  return where.some((w) => w.connector === "OR");
}

/**
 * Apply a single where operator to a Firestore query.
 * Returns null if the operator must be handled client-side.
 */
export function applyOperator(
  query: Query,
  field: string,
  operator: CleanedWhere["operator"],
  value: unknown,
): Query | null {
  switch (operator) {
    case "eq":
      return query.where(field, "==", value);
    case "ne":
      return query.where(field, "!=", value);
    case "gt":
      return query.where(field, ">", value);
    case "gte":
      return query.where(field, ">=", value);
    case "lt":
      return query.where(field, "<", value);
    case "lte":
      return query.where(field, "<=", value);
    case "in":
      return query.where(field, "in", Array.isArray(value) ? value : [value]);
    case "not_in":
      // Firestore supports not-in natively (max 10 values)
      if (Array.isArray(value) && value.length <= 10) {
        return query.where(field, "not-in", value);
      }
      return null; // client-side for >10 values
    case "starts_with": {
      const str = String(value);
      return query
        .where(field, ">=", str)
        .where(field, "<", str + "\uf8ff");
    }
    case "contains":
    case "ends_with":
      return null; // always client-side
    default:
      return query.where(field, "==", value);
  }
}

/**
 * Apply all AND where clauses to a Firestore query.
 * Returns the query and a list of clauses that need client-side filtering.
 */
export function applyWhereClause(
  collection: CollectionReference,
  where: CleanedWhere[],
  mapper: FieldMapper,
): { query: Query; clientFilters: CleanedWhere[] } {
  let query: Query = collection;
  const clientFilters: CleanedWhere[] = [];

  for (const clause of where) {
    if (clause.field === "id") {
      // ID-based queries are handled separately
      clientFilters.push(clause);
      continue;
    }

    const firestoreField = mapper.toFirestore(clause.field);
    const result = applyOperator(query, firestoreField, clause.operator, clause.value);

    if (result) {
      query = result;
    } else {
      clientFilters.push(clause);
    }
  }

  return { query, clientFilters };
}

/**
 * Apply client-side filter to a record.
 */
export function matchesClientFilter(
  record: Record<string, unknown>,
  clause: CleanedWhere,
): boolean {
  const fieldValue = clause.field === "id" ? record.id : record[clause.field];
  const { value } = clause;

  switch (clause.operator) {
    case "eq":
      return fieldValue === value;
    case "ne":
      return fieldValue !== value;
    case "not_in":
      return Array.isArray(value) && !(value as unknown[]).includes(fieldValue);
    case "contains":
      return (
        typeof fieldValue === "string" &&
        typeof value === "string" &&
        fieldValue.includes(value)
      );
    case "ends_with":
      return (
        typeof fieldValue === "string" &&
        typeof value === "string" &&
        fieldValue.endsWith(value)
      );
    case "starts_with":
      return (
        typeof fieldValue === "string" &&
        typeof value === "string" &&
        fieldValue.startsWith(value)
      );
    case "in":
      return Array.isArray(value) && (value as unknown[]).includes(fieldValue);
    case "gt":
      return (fieldValue as number) > (value as number);
    case "gte":
      return (fieldValue as number) >= (value as number);
    case "lt":
      return (fieldValue as number) < (value as number);
    case "lte":
      return (fieldValue as number) <= (value as number);
    default:
      return true;
  }
}

/**
 * Apply all client-side filters to a record.
 */
export function matchesAllClientFilters(
  record: Record<string, unknown>,
  filters: CleanedWhere[],
): boolean {
  return filters.every((f) => matchesClientFilter(record, f));
}

/**
 * Execute batch deletes (up to 500 per batch).
 */
export async function batchDelete(
  db: Firestore,
  refs: DocumentReference[],
): Promise<number> {
  let count = 0;
  for (let i = 0; i < refs.length; i += 500) {
    const chunk = refs.slice(i, i + 500);
    const batch = db.batch();
    for (const ref of chunk) {
      batch.delete(ref);
    }
    await batch.commit();
    count += chunk.length;
  }
  return count;
}

/**
 * Execute batch updates (up to 500 per batch).
 */
export async function batchUpdate(
  db: Firestore,
  refs: DocumentReference[],
  updateData: Record<string, unknown>,
): Promise<number> {
  let count = 0;
  for (let i = 0; i < refs.length; i += 500) {
    const chunk = refs.slice(i, i + 500);
    const batch = db.batch();
    for (const ref of chunk) {
      batch.update(ref, updateData);
    }
    await batch.commit();
    count += chunk.length;
  }
  return count;
}
