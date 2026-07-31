import type { DashboardSummary, Transaction, Wallet, SavingsGoal, Budget } from '@/types';
import { currentMonth, sortTransactionsLatestFirst } from '@/utils/format';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function daysAgoIso(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function isWalletIncludedInMonth(wallet: Wallet, month: string): boolean {
  if (!wallet.includeInBudget) return false;
  const optOuts = wallet.optOutMonths ?? [];
  return !optOuts.includes(month);
}

/** Sums expenses for a user/month, excluding "Transfer" entries and
 * (optionally) wallets that opted out of the monthly budget. */
function sumExpensesForMonth(transactions: Transaction[], wallets: Wallet[], month: string, onlyBudgetedWallets: boolean): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.category !== 'Transfer' && t.date.startsWith(month))
    .filter((t) => {
      if (!onlyBudgetedWallets) return true;
      const w = wallets.find((wal) => wal.id === t.walletId);
      return w ? isWalletIncludedInMonth(w, month) : true;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}



/** Rule-based plain-language spending observations — a direct port of the
 * backend's insights.service.ts, run client-side over the already-loaded
 * transaction list rather than a database query. Intentionally rule-based
 * (not ML) so it stays transparent, fast, and Cloud-Function-free. */
function generateInsights(transactions: Transaction[], budget: Budget | null, wallets: Wallet[]): string[] {
  const insights: string[] = [];
  const since = daysAgoIso(14);
  const expenses = transactions.filter((t) => t.type === 'expense' && t.category !== 'Transfer' && t.date >= since);

  const thisWeekStart = daysAgoIso(7);
  const lastWeekStart = daysAgoIso(14);
  const thisWeek = expenses.filter((t) => t.date >= thisWeekStart);
  const lastWeek = expenses.filter((t) => t.date >= lastWeekStart && t.date < thisWeekStart);

  const sum = (rows: Transaction[]) => rows.reduce((s, t) => s + t.amount, 0);
  const thisWeekTotal = sum(thisWeek);
  const lastWeekTotal = sum(lastWeek);

  if (lastWeekTotal > 0 && thisWeekTotal > lastWeekTotal * 1.1) {
    insights.push('Your spending is increasing compared to last week.');
  } else if (lastWeekTotal > 0 && thisWeekTotal < lastWeekTotal * 0.9) {
    insights.push('Nice work — your spending is down compared to last week.');
  }

  const byCategoryThis = new Map<string, number>();
  const byCategoryLast = new Map<string, number>();
  thisWeek.forEach((t) => byCategoryThis.set(t.category, (byCategoryThis.get(t.category) ?? 0) + t.amount));
  lastWeek.forEach((t) => byCategoryLast.set(t.category, (byCategoryLast.get(t.category) ?? 0) + t.amount));

  let biggestIncrease: { category: string; diff: number } | null = null;
  let biggestDecrease: { category: string; diff: number } | null = null;
  byCategoryThis.forEach((val, cat) => {
    const prev = byCategoryLast.get(cat) ?? 0;
    const diff = val - prev;
    if (prev > 0 && diff > 0 && (!biggestIncrease || diff > biggestIncrease.diff)) {
      biggestIncrease = { category: cat, diff };
    }
  });
  byCategoryLast.forEach((prev, cat) => {
    const val = byCategoryThis.get(cat) ?? 0;
    const diff = val - prev;
    if (val < prev && (!biggestDecrease || diff < biggestDecrease.diff)) biggestDecrease = { category: cat, diff };
  });
  if (biggestIncrease) insights.push(`You spent more on ${(biggestIncrease as { category: string }).category} this week.`);
  if (biggestDecrease) insights.push(`${(biggestDecrease as { category: string }).category} spending decreased this week.`);

  const byDay = new Map<string, number>();
  thisWeek.forEach((t) => {
    const day = DAY_NAMES[new Date(t.date).getDay()];
    byDay.set(day!, (byDay.get(day!) ?? 0) + t.amount);
  });
  if (byDay.size > 0) {
    const [topDay] = Array.from(byDay.entries()).sort((a, b) => b[1] - a[1]);
    insights.push(`${topDay![0]} was your highest spending day this week.`);
  }

  const used = sumExpensesForMonth(transactions, wallets, currentMonth(), false);
  const dayOfMonth = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const budgetAmount = budget?.amount ?? 0;



  if (budgetAmount > 0 && dayOfMonth > 3) {
    const projected = (used / dayOfMonth) * daysInMonth;
    if (projected > budgetAmount) {
      insights.push('At your current pace, you may exceed your monthly budget.');
    }
  }

  return insights.slice(0, 6);
}

/** Client-side port of the backend's dashboard.service.ts. Runs entirely
 * over data the store has already fetched — no extra reads, no Cloud
 * Functions. */
export function computeDashboard(
  wallets: Wallet[],
  transactions: Transaction[],
  goals: SavingsGoal[],
  budget: Budget | null,
  targetMonth = currentMonth(),
): DashboardSummary {
  const month = targetMonth;

  const budgetWallets = wallets.filter((w) => isWalletIncludedInMonth(w, month) && w.allocatedAmount > 0);
  const totalWalletAllocation = budgetWallets.reduce((s, w) => s + w.allocatedAmount, 0);

  const manualBudget = budget?.amount ?? 0;
  const hasSetBudget = manualBudget > 0;

  const effectiveTargetBudget = hasSetBudget ? manualBudget : totalWalletAllocation;
  const monthlyBudget = effectiveTargetBudget;
  const rolloverBalance = 0;

  const usedBudget = sumExpensesForMonth(transactions, wallets, month, true);
  const totalSpentInMonthAllWallets = sumExpensesForMonth(transactions, wallets, month, false);
  const monthlyExpenses = totalSpentInMonthAllWallets;
  const remainingBudget = Math.max(0, monthlyBudget - usedBudget);
  const totalSavings = goals.reduce((s, g) => s + g.savedAmount, 0);

  const isOverAllocated = hasSetBudget && totalWalletAllocation > manualBudget;
  const allocationMismatch = totalWalletAllocation - effectiveTargetBudget;
  const isOverBudget = effectiveTargetBudget > 0 && usedBudget > monthlyBudget;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const byDay = new Map<string, number>();
  transactions
    .filter((t) => t.type === 'expense' && t.category !== 'Transfer')
    .forEach((t) => byDay.set(t.date, (byDay.get(t.date) ?? 0) + t.amount));

  const weeklySpending = DAY_LABELS.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const iso = date.toISOString().slice(0, 10);
    return { day, amount: byDay.get(iso) ?? 0 };
  });

  const recentTransactions = sortTransactionsLatestFirst(transactions).slice(0, 6);

  return {
    selectedMonth: month,
    hasSetBudget,
    monthlyBudget,
    manualBudget,
    totalWalletAllocation,
    rolloverBalance,
    allocationMismatch,
    isOverAllocated,
    isOverBudget,
    usedBudget,
    remainingBudget,
    monthlyExpenses,
    totalSpentInMonthAllWallets,
    totalSavings,
    weeklySpending,
    recentTransactions,
    insights: generateInsights(transactions, budget, wallets),
  };
}

