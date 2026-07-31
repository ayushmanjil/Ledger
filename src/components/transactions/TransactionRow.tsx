import { ArrowDownLeft, ArrowUpRight, Pencil, Trash2 } from 'lucide-react';
import type { Transaction } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatDate } from '@/utils/format';

interface TransactionRowProps {
  tx: Transaction;
  onEdit?: (tx: Transaction) => void;
  onDelete?: (tx: Transaction) => void;
  compact?: boolean;
}

export function TransactionRow({ tx, onEdit, onDelete, compact }: TransactionRowProps) {
  const isIncome = tx.type === 'income';
  return (
    <div className="group flex items-center gap-3 py-3 px-1 border-b border-white/5 last:border-0">
      <div className={`leather-emboss-icon w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isIncome ? 'text-olive-400' : 'text-tan-300'}`}>
        {isIncome ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-cream-50 truncate">{tx.note || tx.category}</p>
        <p className="text-xs text-cream-50/45 truncate">
          {tx.category} · {tx.walletName ?? 'Wallet'} {!compact && `· ${formatDate(tx.date)}`}
        </p>
      </div>
      <Badge tone={isIncome ? 'income' : 'expense'}>
        {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
      </Badge>
      {(onEdit || onDelete) && (
        <div className="flex lg:opacity-0 lg:group-hover:opacity-100 items-center gap-1.5 ml-1 transition-opacity">
          {onEdit && <button onClick={() => onEdit(tx)} className="text-cream-50/40 hover:text-gold-300 p-1"><Pencil size={14} /></button>}
          {onDelete && <button onClick={() => onDelete(tx)} className="text-cream-50/40 hover:text-red-300 p-1"><Trash2 size={14} /></button>}
        </div>
      )}
    </div>
  );
}
