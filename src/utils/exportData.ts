import type { Transaction } from '@/types';

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function transactionsToCsv(transactions: Transaction[]): string {
  const header = ['Date', 'Type', 'Category', 'Wallet', 'Amount', 'Note'];
  const rows = transactions.map(t => [
    t.date, t.type, t.category, t.walletName ?? '', (t.amount / 100).toFixed(2), t.note ?? '',
  ]);
  return [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
