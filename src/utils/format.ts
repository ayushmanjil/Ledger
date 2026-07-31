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
  return new Date().toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
