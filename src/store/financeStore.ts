import { create } from 'zustand';
import type { Wallet, Transaction, Budget, SavingsGoal, DashboardSummary, Debt, WalletType, TransactionType } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { walletsService } from '@/firebase/wallets.service';
import { transactionsService } from '@/firebase/transactions.service';
import { createTransfer } from '@/firebase/transfers.service';
import { budgetsService } from '@/firebase/budgets.service';
import { goalsService } from '@/firebase/goals.service';
import { debtsService } from '@/firebase/debts.service';
import { computeDashboard } from '@/firebase/dashboard';
import { currentMonth } from '@/utils/format';

function requireUid(): string {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) throw new Error('Not signed in');
  return uid;
}

interface FinanceState {
  wallets: Wallet[];
  transactions: Transaction[];
  budget: Budget | null;
  goals: SavingsGoal[];
  debts: Debt[];
  dashboard: DashboardSummary | null;
  loading: boolean;

  fetchAll: () => Promise<void>;
  fetchDashboard: () => Promise<void>;

  addWallet: (data: { name: string; type: WalletType; allocatedAmount?: number; includeInBudget?: boolean; balance?: number }) => Promise<void>;
  updateWallet: (id: string, data: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  transferFunds: (fromWalletId: string, toWalletId: string, amount: number, note: string) => Promise<void>;

  addTransaction: (data: { type: TransactionType; category: string; amount: number; walletId: string; date: string; note?: string }) => Promise<void>;
  addFullDayTransactions: (date: string, rows: { walletId: string; category: string; amount: number; note?: string; type: TransactionType }[]) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  setBudget: (month: string, amount: number) => Promise<void>;

  addGoal: (data: { title: string; targetAmount: number; deadline: string; icon?: string }) => Promise<void>;
  contributeToGoal: (id: string, amount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;

  addDebt: (data: Partial<Debt>) => Promise<void>;
  payDebt: (id: string, amount: number) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;

  reset: () => void;
}

const emptyState = {
  wallets: [] as Wallet[],
  transactions: [] as Transaction[],
  budget: null as Budget | null,
  goals: [] as SavingsGoal[],
  debts: [] as Debt[],
  dashboard: null as DashboardSummary | null,
  loading: false,
};

export const useFinanceStore = create<FinanceState>((set, get) => ({
  ...emptyState,

  fetchAll: async () => {
    const uid = requireUid();
    set({ loading: true });
    try {
      const [wallets, transactions, budget, goals, debts] = await Promise.all([
        walletsService.listByUser(uid),
        transactionsService.listByUser(uid),
        budgetsService.getOrCreate(uid, currentMonth()),
        goalsService.listByUser(uid),
        debtsService.listByUser(uid),
      ]);
      set({ wallets, transactions, budget, goals, debts });
      get().fetchDashboard();
    } finally {
      set({ loading: false });
    }
  },

  fetchDashboard: async () => {
    const { wallets, transactions, goals, budget } = get();
    set({ dashboard: computeDashboard(wallets, transactions, goals, budget) });
  },

  addWallet: async (data) => {
    const uid = requireUid();
    const wallet = await walletsService.create(uid, data);
    set({ wallets: [...get().wallets, wallet] });
  },
  updateWallet: async (id, data) => {
    const uid = requireUid();
    const wallet = await walletsService.update(id, uid, data);
    set({ wallets: get().wallets.map((w) => (w.id === id ? wallet : w)) });
  },
  deleteWallet: async (id) => {
    const uid = requireUid();
    await walletsService.delete(id, uid);
    set({ wallets: get().wallets.filter((w) => w.id !== id) });
    get().fetchAll();
  },
  transferFunds: async (fromWalletId, toWalletId, amount, note) => {
    const uid = requireUid();
    await createTransfer(uid, { fromWalletId, toWalletId, amount, note });
    get().fetchAll();
  },

  addTransaction: async (data) => {
    const uid = requireUid();
    const tx = await transactionsService.create(uid, data);
    set({ transactions: [tx, ...get().transactions] });
    get().fetchAll();
  },
  addFullDayTransactions: async (date, rows) => {
    const uid = requireUid();
    const created = await transactionsService.createBatch(uid, date, rows);
    set({ transactions: [...created, ...get().transactions] });
    get().fetchAll();
  },
  updateTransaction: async (id, data) => {
    const uid = requireUid();
    const tx = await transactionsService.update(uid, id, data);
    set({ transactions: get().transactions.map((t) => (t.id === id ? tx : t)) });
    get().fetchAll();
  },
  deleteTransaction: async (id) => {
    const uid = requireUid();
    await transactionsService.delete(uid, id);
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
    get().fetchAll();
  },

  setBudget: async (month, amount) => {
    const uid = requireUid();
    const budget = await budgetsService.set(uid, month, amount);
    set({ budget });
    get().fetchDashboard();
  },

  addGoal: async (data) => {
    const uid = requireUid();
    const goal = await goalsService.create(uid, data);
    set({ goals: [...get().goals, goal] });
  },
  contributeToGoal: async (id, amount) => {
    const uid = requireUid();
    const goal = await goalsService.contribute(id, uid, amount);
    set({ goals: get().goals.map((g) => (g.id === id ? goal : g)) });
  },
  deleteGoal: async (id) => {
    const uid = requireUid();
    await goalsService.delete(id, uid);
    set({ goals: get().goals.filter((g) => g.id !== id) });
  },

  addDebt: async (data) => {
    const uid = requireUid();
    const debt = await debtsService.create(uid, {
      person_name: data.person_name!,
      type: data.type!,
      amount: data.amount!,
      due_date: data.due_date ?? null,
      note: data.note,
    });
    set({ debts: [debt, ...get().debts] });
  },
  payDebt: async (id, amount) => {
    const uid = requireUid();
    const debt = await debtsService.pay(id, uid, amount);
    set({ debts: get().debts.map((d) => (d.id === id ? debt : d)) });
  },
  deleteDebt: async (id) => {
    const uid = requireUid();
    await debtsService.delete(id, uid);
    set({ debts: get().debts.filter((d) => d.id !== id) });
  },

  reset: () => set({ ...emptyState }),
}));
