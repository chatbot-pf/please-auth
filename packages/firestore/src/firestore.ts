import type { AppOptions } from 'firebase-admin/app'
import type { Firestore } from 'firebase-admin/firestore'
import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, initializeFirestore } from 'firebase-admin/firestore'

export interface InitFirestoreOptions extends AppOptions {
  name?: string
}

/**
 * Initialize or reuse a Firestore instance.
 * Safe for serverless environments — reuses existing Firebase app.
 *
 * @example
 * ```ts
 * import { initFirestore } from "@please-auth/firestore";
 *
 * const db = initFirestore({ projectId: "my-project" });
 * ```
 */
export function initFirestore(options: InitFirestoreOptions = {}): Firestore {
  const { name, ...appOptions } = options
  const apps = getApps()

  if (apps.length > 0) {
    const existing = name
      ? apps.find(a => a.name === name)
      : apps.find(a => a.name === '[DEFAULT]') ?? apps[0]
    if (existing) {
      return getFirestore(existing)
    }
  }

  const app = initializeApp(appOptions, name)
  return initializeFirestore(app)
}
