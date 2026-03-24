import type { Firestore } from "firebase-admin/firestore";

export type NamingStrategy = "default" | "snake_case";

export interface FirestoreAdapterConfig {
  /**
   * Firestore instance. If not provided, uses the default Firebase app's Firestore.
   */
  db?: Firestore;

  /**
   * Field naming strategy.
   * - `"default"`: uses camelCase field names as-is from better-auth
   * - `"snake_case"`: maps camelCase fields to snake_case in Firestore
   * @default "default"
   */
  namingStrategy?: NamingStrategy;

  /**
   * Override default collection names.
   * Keys are better-auth model names (user, session, account, verification).
   */
  collections?: Partial<CollectionNames>;

  /**
   * Enable debug logging.
   * @default false
   */
  debugLogs?: boolean;
}

export interface CollectionNames {
  users: string;
  sessions: string;
  accounts: string;
  verifications: string;
}

export const DEFAULT_COLLECTIONS: CollectionNames = {
  users: "users",
  sessions: "sessions",
  accounts: "accounts",
  verifications: "verifications",
};

export const SNAKE_CASE_FIELD_MAP: Record<string, string> = {
  userId: "user_id",
  sessionToken: "session_token",
  providerAccountId: "provider_account_id",
  emailVerified: "email_verified",
  accessToken: "access_token",
  refreshToken: "refresh_token",
  idToken: "id_token",
  accessTokenExpiresAt: "access_token_expires_at",
  refreshTokenExpiresAt: "refresh_token_expires_at",
  expiresAt: "expires_at",
  createdAt: "created_at",
  updatedAt: "updated_at",
};

export const SNAKE_CASE_FIELD_REVERSE_MAP: Record<string, string> =
  Object.fromEntries(
    Object.entries(SNAKE_CASE_FIELD_MAP).map(([k, v]) => [v, k]),
  );
