import {
  collection, doc, addDoc, updateDoc, deleteDoc, getDoc,
  serverTimestamp, increment, writeBatch, query, where, getDocs,
} from 'firebase/firestore';
import { db } from './config';
import { fetchOwnedDocs, tsToIso } from './utils';
import type { Wallet, WalletType } from '@/types';

const COLORS = ['#B5651D', '#7A3F26', '#A9793C', '#707B4E', '#C68958', '#8A9463'];

interface WalletDoc {
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  allocatedAmount: number;
  includeInBudget: boolean;
  optOutMonths?: string[];
  color: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

function toWallet(id: string, d: WalletDoc): Wallet {
  return {
    id,
    name: d.name,
    type: d.type,
    balance: d.balance,
    allocatedAmount: d.allocatedAmount,
    includeInBudget: d.includeInBudget,
    optOutMonths: d.optOutMonths ?? [],
    color: d.color,
    createdAt: tsToIso(d.createdAt),
  };
}

export const walletsService = {
  async listByUser(uid: string): Promise<Wallet[]> {
    const docs = await fetchOwnedDocs('wallets', uid);
    return docs
      .map((d) => toWallet(d.id, d.data() as WalletDoc))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async create(uid: string, input: {
    name: string; type: WalletType; allocatedAmount?: number; includeInBudget?: boolean; balance?: number;
  }): Promise<Wallet> {
    const existing = await fetchOwnedDocs('wallets', uid);
    const color = COLORS[existing.length % COLORS.length];
    const payload: WalletDoc = {
      userId: uid,
      name: input.name,
      type: input.type,
      balance: input.balance ?? 0,
      allocatedAmount: input.allocatedAmount ?? 0,
      includeInBudget: input.includeInBudget ?? true,
      optOutMonths: [],
      color,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'wallets'), payload);
    return toWallet(ref.id, { ...payload, createdAt: new Date() });
  },

  async update(id: string, uid: string, input: Partial<{
    name: string; type: WalletType; allocatedAmount: number; includeInBudget: boolean; optOutMonths: string[];
  }>): Promise<Wallet> {
    const ref = doc(db, 'wallets', id);
    const snap = await getDoc(ref);
    if (!snap.exists() || (snap.data() as WalletDoc).userId !== uid) throw new Error('Wallet not found');
    const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (input.name !== undefined) patch.name = input.name;
    if (input.type !== undefined) patch.type = input.type;
    if (input.allocatedAmount !== undefined) patch.allocatedAmount = input.allocatedAmount;
    if (input.includeInBudget !== undefined) patch.includeInBudget = input.includeInBudget;
    if (input.optOutMonths !== undefined) patch.optOutMonths = input.optOutMonths;
    await updateDoc(ref, patch);
    const updated = await getDoc(ref);
    return toWallet(id, updated.data() as WalletDoc);
  },

  async toggleOptOutMonth(id: string, uid: string, month: string): Promise<Wallet> {
    const ref = doc(db, 'wallets', id);
    const snap = await getDoc(ref);
    if (!snap.exists() || (snap.data() as WalletDoc).userId !== uid) throw new Error('Wallet not found');
    const data = snap.data() as WalletDoc;
    const currentOptOut = data.optOutMonths ?? [];
    const isOptedOut = currentOptOut.includes(month);
    const nextOptOut = isOptedOut
      ? currentOptOut.filter((m) => m !== month)
      : [...currentOptOut, month];

    await updateDoc(ref, { optOutMonths: nextOptOut, updatedAt: serverTimestamp() });
    const updated = await getDoc(ref);
    return toWallet(id, updated.data() as WalletDoc);
  },

  /** Deletes a wallet along with every transaction and transfer that
   * references it, mirroring the ON DELETE CASCADE behaviour the original
   * Postgres schema had on wallets → transactions/transfers. */
  async delete(id: string, uid: string): Promise<void> {
    const ref = doc(db, 'wallets', id);
    const snap = await getDoc(ref);
    if (!snap.exists() || (snap.data() as WalletDoc).userId !== uid) throw new Error('Wallet not found');

    const [txSnap, transferFromSnap, transferToSnap] = await Promise.all([
      getDocs(query(collection(db, 'transactions'), where('userId', '==', uid), where('walletId', '==', id))),
      getDocs(query(collection(db, 'transfers'), where('userId', '==', uid), where('fromWalletId', '==', id))),
      getDocs(query(collection(db, 'transfers'), where('userId', '==', uid), where('toWalletId', '==', id))),
    ]);

    const batch = writeBatch(db);
    txSnap.docs.forEach((d) => batch.delete(d.ref));
    transferFromSnap.docs.forEach((d) => batch.delete(d.ref));
    transferToSnap.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(ref);
    await batch.commit();
  },

  /** Adjusts a wallet's balance by `delta` (positive or negative) using an
   * atomic Firestore increment — safe for concurrent adjustments. */
  async adjustBalance(id: string, delta: number): Promise<void> {
    await updateDoc(doc(db, 'wallets', id), { balance: increment(delta), updatedAt: serverTimestamp() });
  },
};
