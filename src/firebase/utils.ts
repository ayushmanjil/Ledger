import {
  collection, query, where, getDocs, Timestamp,
  type DocumentData, type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from './config';

/** Converts a Firestore Timestamp (or an already-ISO string, or undefined
 * during the brief window before serverTimestamp() resolves) into an ISO
 * date string, which is the shape every frontend type expects. */
export function tsToIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
}

/** Fetches every document in `collectionName` owned by `uid`.
 *
 * Deliberately uses a single equality filter with no orderBy so that no
 * Firestore composite index ever needs to be created manually — sorting,
 * filtering, and aggregation all happen in JS afterwards. This keeps the
 * "create project → paste config → deploy" promise in the README true
 * without any extra Firebase Console setup, at the cost of pulling a
 * user's full collection client-side (entirely reasonable at personal
 * finance app scale).
 */
export async function fetchOwnedDocs(collectionName: string, uid: string): Promise<QueryDocumentSnapshot<DocumentData>[]> {
  const q = query(collection(db, collectionName), where('userId', '==', uid));
  const snap = await getDocs(q);
  return snap.docs;
}
