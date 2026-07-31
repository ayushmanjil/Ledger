import {
  collection, doc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { fetchOwnedDocs, tsToIso } from './utils';
import type { Transaction, TransactionType } from '@/types';

interface TransactionDoc {
  userId: string;
  walletId: string;
  walletName: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

interface WalletDocShape {
  userId: string;
  name: string;
  balance: number;
  allocatedAmount: number;
}

function toTransaction(id: string, d: TransactionDoc): Transaction {
  return {
    id,
    walletId: d.walletId,
    walletName: d.walletName,
    type: d.type,
    category: d.category,
    amount: d.amount,
    note: d.note,
    date: d.date,
    createdAt: tsToIso(d.createdAt),
  };
}

function balanceDelta(type: TransactionType, amount: number): number {
  return type === 'income' ? amount : -amount;
}

/** Income adds to the total wallet pot (allocatedAmount); expenses do not. */
function allocatedDelta(type: TransactionType, amount: number): number {
  return type === 'income' ? amount : 0;
}

export const transactionsService = {
  async listByUser(uid: string): Promise<Transaction[]> {
    const docs = await fetchOwnedDocs('transactions', uid);
    return docs
      .map((d) => toTransaction(d.id, d.data() as TransactionDoc))
      .sort((a, b) => (a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date)));
  },

  async create(uid: string, input: {
    walletId: string; type: TransactionType; category: string; amount: number; note?: string; date: string;
  }): Promise<Transaction> {
    if (input.amount <= 0) throw new Error('Amount must be greater than zero');

    const txRef = doc(collection(db, 'transactions'));
    const walletRef = doc(db, 'wallets', input.walletId);

    return runTransaction(db, async (t) => {
      const walletSnap = await t.get(walletRef);
      if (!walletSnap.exists()) throw new Error('Wallet not found');
      const wallet = walletSnap.data() as WalletDocShape;
      if (wallet.userId !== uid) throw new Error('Wallet not found');

      const payload: TransactionDoc = {
        userId: uid,
        walletId: input.walletId,
        walletName: wallet.name,
        type: input.type,
        category: input.category,
        amount: input.amount,
        note: input.note ?? '',
        date: input.date,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      t.set(txRef, payload);
      t.update(walletRef, {
        balance: wallet.balance + balanceDelta(input.type, input.amount),
        // Income grows the total pot; expenses only drain the balance.
        allocatedAmount: wallet.allocatedAmount + allocatedDelta(input.type, input.amount),
      });
      return toTransaction(txRef.id, { ...payload, createdAt: new Date() });
    });
  },

  async update(uid: string, id: string, input: Partial<{
    walletId: string; type: TransactionType; category: string; amount: number; note: string; date: string;
  }>): Promise<Transaction> {
    const txRef = doc(db, 'transactions', id);

    return runTransaction(db, async (t) => {
      const txSnap = await t.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');
      const existing = txSnap.data() as TransactionDoc;
      if (existing.userId !== uid) throw new Error('Transaction not found');

      const next = {
        walletId: input.walletId ?? existing.walletId,
        type: input.type ?? existing.type,
        category: input.category ?? existing.category,
        amount: input.amount ?? existing.amount,
        note: input.note ?? existing.note,
        date: input.date ?? existing.date,
      };
      if (next.amount <= 0) throw new Error('Amount must be greater than zero');

      const oldWalletRef = doc(db, 'wallets', existing.walletId);
      const oldWalletSnap = await t.get(oldWalletRef);
      if (!oldWalletSnap.exists()) throw new Error('Wallet not found');
      const oldWallet = oldWalletSnap.data() as WalletDocShape;

      const sameWallet = next.walletId === existing.walletId;
      const newWalletRef = sameWallet ? oldWalletRef : doc(db, 'wallets', next.walletId);
      const newWalletSnap = sameWallet ? oldWalletSnap : await t.get(newWalletRef);
      if (!newWalletSnap.exists()) throw new Error('Wallet not found');
      const newWallet = newWalletSnap.data() as WalletDocShape;
      if (newWallet.userId !== uid) throw new Error('Wallet not found');

      // Reverse the old effect (balance + allocated), then apply the new one.
      if (sameWallet) {
        const balanceNet = -balanceDelta(existing.type, existing.amount) + balanceDelta(next.type, next.amount);
        const allocatedNet = -allocatedDelta(existing.type, existing.amount) + allocatedDelta(next.type, next.amount);
        t.update(oldWalletRef, {
          balance: oldWallet.balance + balanceNet,
          allocatedAmount: oldWallet.allocatedAmount + allocatedNet,
        });
      } else {
        t.update(oldWalletRef, {
          balance: oldWallet.balance - balanceDelta(existing.type, existing.amount),
          allocatedAmount: oldWallet.allocatedAmount - allocatedDelta(existing.type, existing.amount),
        });
        t.update(newWalletRef, {
          balance: newWallet.balance + balanceDelta(next.type, next.amount),
          allocatedAmount: newWallet.allocatedAmount + allocatedDelta(next.type, next.amount),
        });
      }

      const payload: TransactionDoc = {
        userId: uid,
        walletId: next.walletId,
        walletName: newWallet.name,
        type: next.type,
        category: next.category,
        amount: next.amount,
        note: next.note,
        date: next.date,
        createdAt: existing.createdAt,
        updatedAt: serverTimestamp(),
      };
      t.update(txRef, payload as unknown as Record<string, unknown>);
      return toTransaction(id, payload);
    });
  },

  async delete(uid: string, id: string): Promise<void> {
    const txRef = doc(db, 'transactions', id);
    await runTransaction(db, async (t) => {
      const txSnap = await t.get(txRef);
      if (!txSnap.exists()) throw new Error('Transaction not found');
      const existing = txSnap.data() as TransactionDoc;
      if (existing.userId !== uid) throw new Error('Transaction not found');

      const walletRef = doc(db, 'wallets', existing.walletId);
      const walletSnap = await t.get(walletRef);
      if (walletSnap.exists()) {
        const wallet = walletSnap.data() as WalletDocShape;
        t.update(walletRef, {
          balance: wallet.balance - balanceDelta(existing.type, existing.amount),
          // Reverse the income contribution to the pot if this was income.
          allocatedAmount: wallet.allocatedAmount - allocatedDelta(existing.type, existing.amount),
        });
      }
      t.delete(txRef);
    });
  },

  /** Creates every row from an "Add Full Day Expenses" submission
   * atomically: either all rows are saved and all wallet balances updated,
   * or none are (Firestore transactions guarantee this). */
  async createBatch(uid: string, date: string, rows: {
    walletId: string; category: string; amount: number; note?: string; type: TransactionType;
  }[]): Promise<Transaction[]> {
    const txRefs = rows.map(() => doc(collection(db, 'transactions')));

    return runTransaction(db, async (t) => {
      // Read every wallet involved first (Firestore transactions require
      // all reads before any writes).
      const uniqueWalletIds = Array.from(new Set(rows.map((r) => r.walletId)));
      const walletSnaps = new Map<string, WalletDocShape>();
      for (const walletId of uniqueWalletIds) {
        const snap = await t.get(doc(db, 'wallets', walletId));
        if (!snap.exists()) throw new Error('Wallet not found');
        const wallet = snap.data() as WalletDocShape;
        if (wallet.userId !== uid) throw new Error('Wallet not found');
        walletSnaps.set(walletId, wallet);
      }

      const balanceDeltas = new Map<string, number>();
      const allocatedDeltas = new Map<string, number>();
      const created: Transaction[] = [];

      rows.forEach((r, i) => {
        if (r.amount <= 0) throw new Error('Amount must be greater than zero');
        const wallet = walletSnaps.get(r.walletId)!;
        const payload: TransactionDoc = {
          userId: uid,
          walletId: r.walletId,
          walletName: wallet.name,
          type: r.type,
          category: r.category,
          amount: r.amount,
          note: r.note ?? '',
          date,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        t.set(txRefs[i]!, payload);
        created.push(toTransaction(txRefs[i]!.id, { ...payload, createdAt: new Date() }));
        balanceDeltas.set(r.walletId, (balanceDeltas.get(r.walletId) ?? 0) + balanceDelta(r.type, r.amount));
        allocatedDeltas.set(r.walletId, (allocatedDeltas.get(r.walletId) ?? 0) + allocatedDelta(r.type, r.amount));
      });

      balanceDeltas.forEach((delta, walletId) => {
        const wallet = walletSnaps.get(walletId)!;
        t.update(doc(db, 'wallets', walletId), {
          balance: wallet.balance + delta,
          allocatedAmount: wallet.allocatedAmount + (allocatedDeltas.get(walletId) ?? 0),
        });
      });

      return created;
    });
  },
};
