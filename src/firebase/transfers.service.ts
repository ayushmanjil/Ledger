import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { todayISO } from '@/utils/format';

interface WalletDocShape {
  userId: string;
  name: string;
  balance: number;
}

/** A transfer moves money between two of the user's own wallets. It also
 * writes a matching expense/income transaction pair (category "Transfer")
 * so it shows up in transaction history, while dashboard/budget/analytics
 * aggregation excludes the "Transfer" category so internal movement never
 * inflates spending totals (see firebase/dashboard.ts). Everything happens
 * inside one Firestore transaction: both balance changes, both
 * transaction rows, and the transfer record itself either all commit or
 * all roll back together. */
export async function createTransfer(uid: string, input: {
  fromWalletId: string; toWalletId: string; amount: number; note?: string;
}): Promise<void> {
  if (input.fromWalletId === input.toWalletId) throw new Error('Cannot transfer to the same wallet');
  if (input.amount <= 0) throw new Error('Amount must be greater than zero');

  const fromRef = doc(db, 'wallets', input.fromWalletId);
  const toRef = doc(db, 'wallets', input.toWalletId);
  const fromTxRef = doc(collection(db, 'transactions'));
  const toTxRef = doc(collection(db, 'transactions'));
  const transferRef = doc(collection(db, 'transfers'));
  const date = todayISO();

  await runTransaction(db, async (t) => {
    const [fromSnap, toSnap] = await Promise.all([t.get(fromRef), t.get(toRef)]);
    if (!fromSnap.exists() || !toSnap.exists()) throw new Error('Wallet not found');
    const from = fromSnap.data() as WalletDocShape;
    const to = toSnap.data() as WalletDocShape;
    if (from.userId !== uid || to.userId !== uid) throw new Error('Wallet not found');

    const note = input.note ?? '';

    t.set(fromTxRef, {
      userId: uid, walletId: input.fromWalletId, walletName: from.name,
      type: 'expense', category: 'Transfer', amount: input.amount,
      note: note || `Transfer to ${to.name}`, date,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    t.update(fromRef, { balance: from.balance - input.amount });

    t.set(toTxRef, {
      userId: uid, walletId: input.toWalletId, walletName: to.name,
      type: 'income', category: 'Transfer', amount: input.amount,
      note: note || `Transfer from ${from.name}`, date,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    });
    t.update(toRef, { balance: to.balance + input.amount });

    t.set(transferRef, {
      userId: uid, fromWalletId: input.fromWalletId, toWalletId: input.toWalletId,
      amount: input.amount, note, date, createdAt: serverTimestamp(),
    });
  });
}
