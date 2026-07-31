import type { Transaction, TransactionType, Wallet } from '@/types';
import { toPaise } from '@/utils/format';

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

export interface ParsedImportRow {
  walletId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  note?: string;
}

export function parseCsv(content: string): string[][] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let insideQuote = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuote && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuote = !insideQuote;
        }
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  });
}

export function importTransactionsFromJsonOrCsv(
  fileText: string,
  fileName: string,
  wallets: Wallet[]
): ParsedImportRow[] {
  const defaultWalletId = wallets[0]?.id || '';
  const walletMap = new Map<string, string>();
  wallets.forEach((w) => {
    walletMap.set(w.name.toLowerCase(), w.id);
    walletMap.set(w.id, w.id);
  });

  const getWalletId = (nameOrId?: string) => {
    if (!nameOrId) return defaultWalletId;
    const match = walletMap.get(nameOrId.toLowerCase()) || walletMap.get(nameOrId);
    return match || defaultWalletId;
  };

  const isJson = fileName.endsWith('.json') || fileText.trim().startsWith('{') || fileText.trim().startsWith('[');

  if (isJson) {
    const data = JSON.parse(fileText);
    const rawList: any[] = Array.isArray(data) ? data : Array.isArray(data.transactions) ? data.transactions : [];

    return rawList
      .filter((t) => t && (t.amount > 0 || Number(t.amount) > 0))
      .map((t) => {
        const rawAmount = Number(t.amount);
        // If amount has decimals or is rupees, or if from standard json export integer paise
        const paise = Number.isInteger(rawAmount) && rawAmount > 500 ? rawAmount : toPaise(rawAmount);
        const type: TransactionType = t.type === 'income' ? 'income' : 'expense';
        const date = t.date ? String(t.date).slice(0, 10) : new Date().toISOString().slice(0, 10);
        return {
          walletId: getWalletId(t.walletId || t.walletName),
          type,
          category: String(t.category || 'General'),
          amount: paise,
          date,
          note: t.note ? String(t.note) : '',
        };
      });
  } else {
    // Parse CSV
    const rows = parseCsv(fileText);
    if (rows.length <= 1) return [];

    const headers = rows[0]!.map((h) => h.toLowerCase().replace(/[^a-z]/g, ''));
    const dateIdx = headers.indexOf('date');
    const typeIdx = headers.indexOf('type');
    const catIdx = headers.indexOf('category');
    const walletIdx = headers.indexOf('wallet');
    const amountIdx = headers.indexOf('amount');
    const noteIdx = headers.indexOf('note');

    const parsed: ParsedImportRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]!;
      if (row.length < 2) continue;

      const date = (dateIdx !== -1 ? row[dateIdx] : row[0]) || new Date().toISOString().slice(0, 10);
      const rawType = (typeIdx !== -1 ? row[typeIdx] : row[1]) || 'expense';
      const type: TransactionType = rawType.toLowerCase() === 'income' ? 'income' : 'expense';
      const category = (catIdx !== -1 ? row[catIdx] : row[2]) || 'General';
      const walletName = walletIdx !== -1 ? row[walletIdx] : row[3];
      const rawAmountStr = amountIdx !== -1 ? row[amountIdx] : row[4];
      const note = noteIdx !== -1 ? row[noteIdx] : row[5] || '';

      const numAmount = parseFloat((rawAmountStr || '0').replace(/[^0-9.]/g, ''));
      if (isNaN(numAmount) || numAmount <= 0) continue;

      parsed.push({
        walletId: getWalletId(walletName),
        type,
        category,
        amount: toPaise(numAmount),
        date: date.slice(0, 10),
        note,
      });
    }

    return parsed;
  }
}

