import { writeBatch } from 'firebase/firestore';
import { db } from './config';
import { fetchOwnedDocs } from './utils';

const RESETTABLE_COLLECTIONS = ['wallets', 'transactions', 'transfers', 'budgets', 'savings_goals', 'debts'];

/** Deletes every wallet, transaction, transfer, budget, savings goal, and
 * debt owned by the user, in chunked batched writes (Firestore batches
 * cap at 500 operations). The user's Firebase Auth account and Firestore
 * profile document are left untouched, matching the original backend's
 * resetUserData behaviour. */
export async function resetUserData(uid: string): Promise<void> {
  for (const collectionName of RESETTABLE_COLLECTIONS) {
    const docs = await fetchOwnedDocs(collectionName, uid);
    for (let i = 0; i < docs.length; i += 450) {
      const batch = writeBatch(db);
      docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
