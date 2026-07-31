import type { Transaction } from '@/types';

// All amounts move through the app as integer paise. This is the ONLY place
// currency formatting happens, which is what makes multi-currency support
// later a one-function change rather than a data migration.

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatCurrency(paise: number, currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + ' ';
  const rupees = paise / 100;
  const formatted = rupees.toLocaleString('en-IN', {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${symbol}${formatted}`;
}

export function formatAxisCurrency(paise: number, currency = 'INR'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency + ' ';
  const rupees = paise / 100;
  const abs = Math.abs(rupees);

  if (abs === 0) return `${symbol}0`;
  if (abs >= 10_00_000) {
    const formatted = (rupees / 10_00_000).toLocaleString('en-IN', { maximumFractionDigits: 1 });
    return `${symbol}${formatted}M`;
  }
  if (abs >= 1_000) {
    const formatted = (rupees / 1_000).toLocaleString('en-IN', { maximumFractionDigits: 1 });
    return `${symbol}${formatted}k`;
  }
  return `${symbol}${Math.round(rupees)}`;
}

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function toRupees(paise: number): number {
  return paise / 100;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function todayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentMonth(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getPrevMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const d = new Date(year, month - 2, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getNextMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  if (!year || !month) return monthStr;
  const d = new Date(year, month, 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getMonthList(aroundMonth = currentMonth(), pastCount = 6, futureCount = 3): string[] {
  const list: string[] = [];
  let curr = aroundMonth;
  for (let i = pastCount; i > 0; i--) {
    let p = curr;
    for (let j = 0; j < i; j++) {
      p = getPrevMonth(p);
    }
    if (!list.includes(p)) list.push(p);
  }
  if (!list.includes(aroundMonth)) list.push(aroundMonth);
  let next = aroundMonth;
  for (let i = 1; i <= futureCount; i++) {
    next = getNextMonth(next);
    if (!list.includes(next)) list.push(next);
  }
  return list;
}

export function sortTransactionsLatestFirst(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return (b.id || '').localeCompare(a.id || '');
  });
}


