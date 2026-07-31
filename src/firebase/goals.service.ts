import {
  collection, doc, addDoc, deleteDoc, getDoc, runTransaction,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from './config';
import { fetchOwnedDocs, tsToIso } from './utils';
import type { SavingsGoal } from '@/types';

interface GoalDoc {
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  icon: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function toGoal(id: string, d: GoalDoc): SavingsGoal {
  return {
    id,
    title: d.title,
    targetAmount: d.targetAmount,
    savedAmount: d.savedAmount,
    deadline: d.deadline,
    icon: d.icon,
    createdAt: tsToIso(d.createdAt),
  };
}

export const goalsService = {
  async listByUser(uid: string): Promise<SavingsGoal[]> {
    const docs = await fetchOwnedDocs('savings_goals', uid);
    return docs
      .map((d) => toGoal(d.id, d.data() as GoalDoc))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async create(uid: string, input: { title: string; targetAmount: number; deadline: string; icon?: string }): Promise<SavingsGoal> {
    const payload: GoalDoc = {
      userId: uid,
      title: input.title,
      targetAmount: input.targetAmount,
      savedAmount: 0,
      deadline: input.deadline,
      icon: input.icon ?? 'target',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'savings_goals'), payload);
    return toGoal(ref.id, { ...payload, createdAt: new Date() });
  },

  async contribute(id: string, uid: string, amount: number): Promise<SavingsGoal> {
    const ref = doc(db, 'savings_goals', id);
    return runTransaction(db, async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists()) throw new Error('Goal not found');
      const existing = snap.data() as GoalDoc;
      if (existing.userId !== uid) throw new Error('Goal not found');
      t.update(ref, { savedAmount: increment(amount), updatedAt: serverTimestamp() });
      return toGoal(id, { ...existing, savedAmount: existing.savedAmount + amount });
    });
  },

  async delete(id: string, uid: string): Promise<void> {
    const ref = doc(db, 'savings_goals', id);
    const snap = await getDoc(ref);
    if (!snap.exists() || (snap.data() as GoalDoc).userId !== uid) throw new Error('Goal not found');
    await deleteDoc(ref);
  },
};
