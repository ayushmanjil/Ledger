import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import type { Budget } from '@/types';

interface BudgetDoc {
  userId: string;
  month: string;
  amount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function budgetDocId(uid: string, month: string): string {
  return `${uid}_${month}`;
}

function toBudget(month: string, d: BudgetDoc): Budget {
  return { id: month, month: d.month, amount: d.amount };
}

export const budgetsService = {
  async getOrCreate(uid: string, month: string): Promise<Budget> {
    const ref = doc(db, 'budgets', budgetDocId(uid, month));
    const snap = await getDoc(ref);
    if (snap.exists()) return toBudget(month, snap.data() as BudgetDoc);

    const payload: BudgetDoc = { userId: uid, month, amount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await setDoc(ref, payload);
    return toBudget(month, payload);
  },

  async set(uid: string, month: string, amount: number): Promise<Budget> {
    const ref = doc(db, 'budgets', budgetDocId(uid, month));
    const payload: BudgetDoc = { userId: uid, month, amount, updatedAt: serverTimestamp() };
    await setDoc(ref, payload, { merge: true });
    return toBudget(month, { userId: uid, month, amount });
  },
};
