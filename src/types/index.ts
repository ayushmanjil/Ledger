// Core domain types shared across the app. Money amounts are integers in paise.
// Note: `id` fields are strings — Firestore document IDs — whereas the
// original Postgres-backed version used numeric bigserial IDs.

export interface User {
  id: string;
  name: string;
  username: string;
  currency: string;
  theme: 'light' | 'dark';
}

export type WalletType = 'cash' | 'bank' | 'upi' | 'credit_card' | 'savings' | 'custom';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  allocatedAmount: number;
  includeInBudget: boolean;
  optOutMonths?: string[]; // List of YYYY-MM months where wallet is opted out of monthly budget
  color: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  walletId: string;
  walletName?: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  date: string; // ISO date
  createdAt: string;
}

export interface Transfer {
  id: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  note: string;
  date: string;
}

export interface Budget {
  id: string;
  month: string; // YYYY-MM
  amount: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  icon: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  user_id: string;
  person_name: string;
  type: 'borrowed' | 'lent';
  amount: number;
  paid_amount: number;
  due_date: string | null;
  status: 'active' | 'settled';
  note: string;
  created_at: string;
}

export interface DashboardSummary {
  selectedMonth: string;
  hasSetBudget: boolean;
  monthlyBudget: number;
  manualBudget: number;
  totalWalletAllocation: number;
  rolloverBalance: number;
  allocationMismatch: number;
  isOverAllocated: boolean;
  isOverBudget: boolean;
  usedBudget: number;
  remainingBudget: number;
  monthlyExpenses: number;
  totalSpentInMonthAllWallets: number;
  totalSavings: number;
  weeklySpending: { day: string; amount: number }[];
  recentTransactions: Transaction[];
  insights: string[];
}

export const EXPENSE_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Entertainment', 'Bills',
  'Health', 'Groceries', 'Rent', 'Travel', 'Education', 'Other',
];

export const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Gift', 'Refund', 'Other',
];
