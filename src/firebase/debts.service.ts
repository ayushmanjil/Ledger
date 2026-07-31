import {
  collection, doc, addDoc, deleteDoc, getDoc, runTransaction, serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { fetchOwnedDocs, tsToIso } from './utils';
import type { Debt } from '@/types';

interface DebtDoc {
  userId: string;
  person_name: string;
  type: 'borrowed' | 'lent';
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: 'active' | 'settled';
  note: string;
  created_at?: unknown;
  updated_at?: unknown;
}

function toDebt(id: string, uid: string, d: DebtDoc): Debt {
  return {
    id,
    user_id: uid,
    person_name: d.person_name,
    type: d.type,
    amount: d.amount,
    paid_amount: d.paid_amount,
    due_date: d.due_date,
    status: d.status,
    note: d.note,
    created_at: tsToIso(d.created_at),
  };
}

export const debtsService = {
  async listByUser(uid: string): Promise<Debt[]> {
    const docs = await fetchOwnedDocs('debts', uid);
    return docs
      .map((d) => toDebt(d.id, uid, d.data() as DebtDoc))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async create(uid: string, input: {
    person_name: string; type: 'borrowed' | 'lent'; amount: number; due_date?: string | null; note?: string;
  }): Promise<Debt> {
    const payload: DebtDoc = {
      userId: uid,
      person_name: input.person_name,
      type: input.type,
      amount: input.amount,
      paid_amount: 0,
      due_date: input.due_date ?? null,
      status: 'active',
      note: input.note ?? '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'debts'), payload);
    return toDebt(ref.id, uid, { ...payload, created_at: new Date() });
  },

  async pay(id: string, uid: string, paymentAmount: number): Promise<Debt> {
    const ref = doc(db, 'debts', id);
    return runTransaction(db, async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists()) throw new Error('Debt not found');
      const existing = snap.data() as DebtDoc;
      if (existing.userId !== uid) throw new Error('Debt not found');

      const newPaid = existing.paid_amount + paymentAmount;
      if (newPaid > existing.amount) throw new Error('Payment exceeds total debt amount');
      const newStatus = newPaid === existing.amount ? 'settled' : 'active';

      t.update(ref, { paid_amount: newPaid, status: newStatus, updated_at: serverTimestamp() });
      return toDebt(id, uid, { ...existing, paid_amount: newPaid, status: newStatus });
    });
  },

  async delete(id: string, uid: string): Promise<void> {
    const ref = doc(db, 'debts', id);
    const snap = await getDoc(ref);
    if (!snap.exists() || (snap.data() as DebtDoc).userId !== uid) throw new Error('Debt not found');
    await deleteDoc(ref);
  },
};
