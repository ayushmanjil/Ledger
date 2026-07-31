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
import { currentMonth, sortTransactionsLatestFirst } from '@/utils/format';

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

  fetchAll: (force?: boolean) => Promise<void>;
  fetchDashboard: () => Promise<void>;

  addWallet: (data: { name: string; type: WalletType; allocatedAmount?: number; includeInBudget?: boolean; balance?: number }) => Promise<void>;
  updateWallet: (id: string, data: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  transferFunds: (fromWalletId: string, toWalletId: string, amount: number, note: string) => Promise<void>;

  addTransaction: (data: { type: TransactionType; category: string; amount: number; walletId: string; date: string; note?: string }) => Promise<void>;
  addFullDayTransactions: (date: string, rows: { walletId: string; category: string; amount: number; note?: string; type: TransactionType }[]) => Promise<void>;
  importTransactions: (rows: { walletId: string; type: TransactionType; category: string; amount: number; date: string; note?: string }[]) => Promise<number>;
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

  fetchAll: async (force = false) => {
    const uid = requireUid();
    const { wallets, transactions } = get();

    // Cache-first: if data is already loaded in memory and not explicitly forced,
    // refresh dashboard instantly without triggering 5 redundant Firestore network queries.
    if (!force && wallets.length > 0 && transactions.length > 0) {
      get().fetchDashboard();
      return;
    }

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
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const targetWallet = get().wallets.find((w) => w.id === data.walletId);
    const walletName = targetWallet?.name || 'Wallet';

    const optimisticTx: Transaction = {
      id: tempId,
      walletId: data.walletId,
      walletName,
      type: data.type,
      category: data.category,
      amount: data.amount,
      note: data.note || '',
      date: data.date,
      createdAt: new Date().toISOString(),
    };

    const delta = data.type === 'income' ? data.amount : -data.amount;
    const allocDelta = data.type === 'income' ? data.amount : 0;

    const nextTxs = sortTransactionsLatestFirst([optimisticTx, ...get().transactions]);
    const nextWallets = get().wallets.map((w) => {
      if (w.id === data.walletId) {
        return {
          ...w,
          balance: w.balance + delta,
          allocatedAmount: w.allocatedAmount + allocDelta,
        };
      }
      return w;
    });

    set({ transactions: nextTxs, wallets: nextWallets });
    get().fetchDashboard();

    try {
      const realTx = await transactionsService.create(uid, data);
      set({
        transactions: get().transactions.map((t) => (t.id === tempId ? realTx : t)),
      });
      get().fetchDashboard();
    } catch (err) {
      get().fetchAll(true);
      throw err;
    }
  },

  addFullDayTransactions: async (date, rows) => {
    const uid = requireUid();
    const tempTxs: Transaction[] = [];
    const walletDeltas = new Map<string, { balance: number; allocated: number }>();

    rows.forEach((r, idx) => {
      const wallet = get().wallets.find((w) => w.id === r.walletId);
      const walletName = wallet?.name || 'Wallet';
      const tempId = `temp-batch-${Date.now()}-${idx}`;
      tempTxs.push({
        id: tempId,
        walletId: r.walletId,
        walletName,
        type: r.type,
        category: r.category,
        amount: r.amount,
        note: r.note || '',
        date,
        createdAt: new Date().toISOString(),
      });

      const bDelta = r.type === 'income' ? r.amount : -r.amount;
      const aDelta = r.type === 'income' ? r.amount : 0;
      const prev = walletDeltas.get(r.walletId) || { balance: 0, allocated: 0 };
      walletDeltas.set(r.walletId, { balance: prev.balance + bDelta, allocated: prev.allocated + aDelta });
    });

    const nextTxs = sortTransactionsLatestFirst([...tempTxs, ...get().transactions]);
    const nextWallets = get().wallets.map((w) => {
      const deltas = walletDeltas.get(w.id);
      if (deltas) {
        return {
          ...w,
          balance: w.balance + deltas.balance,
          allocatedAmount: w.allocatedAmount + deltas.allocated,
        };
      }
      return w;
    });

    set({ transactions: nextTxs, wallets: nextWallets });
    get().fetchDashboard();

    try {
      await transactionsService.createBatch(uid, date, rows);
      get().fetchAll(true);
    } catch (err) {
      get().fetchAll(true);
      throw err;
    }
  },

  importTransactions: async (rows) => {
    const uid = requireUid();
    if (rows.length === 0) return 0;
    // Group by date for batch creating
    const byDate = new Map<string, typeof rows>();
    rows.forEach((r) => {
      const list = byDate.get(r.date) || [];
      list.push(r);
      byDate.set(r.date, list);
    });
    let importedCount = 0;
    for (const [date, dateRows] of byDate.entries()) {
      // Chunk in max 20 rows per batch transaction
      for (let i = 0; i < dateRows.length; i += 20) {
        const chunk = dateRows.slice(i, i + 20);
        await transactionsService.createBatch(uid, date, chunk);
        importedCount += chunk.length;
      }
    }
    await get().fetchAll(true);
    return importedCount;
  },

  updateTransaction: async (id, data) => {
    const uid = requireUid();
    try {
      const tx = await transactionsService.update(uid, id, data);
      set({ transactions: sortTransactionsLatestFirst(get().transactions.map((t) => (t.id === id ? tx : t))) });
      get().fetchAll(true);
    } catch (err) {
      get().fetchAll(true);
      throw err;
    }
  },

  deleteTransaction: async (id) => {
    const uid = requireUid();
    const targetTx = get().transactions.find((t) => t.id === id);

    if (targetTx) {
      const bDelta = targetTx.type === 'income' ? -targetTx.amount : targetTx.amount;
      const aDelta = targetTx.type === 'income' ? -targetTx.amount : 0;

      const nextTxs = get().transactions.filter((t) => t.id !== id);
      const nextWallets = get().wallets.map((w) => {
        if (w.id === targetTx.walletId) {
          return {
            ...w,
            balance: w.balance + bDelta,
            allocatedAmount: w.allocatedAmount + aDelta,
          };
        }
        return w;
      });

      set({ transactions: nextTxs, wallets: nextWallets });
      get().fetchDashboard();
    }

    try {
      await transactionsService.delete(uid, id);
    } catch (err) {
      get().fetchAll(true);
      throw err;
    }
  },

  setBudget: async (month, amount) => {
    const uid = requireUid();
    const nextBudget = { id: month, month, amount, userId: uid };
    set({ budget: nextBudget });
    get().fetchDashboard();

    try {
      await budgetsService.set(uid, month, amount);
    } catch (err) {
      get().fetchAll(true);
      throw err;
    }
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
