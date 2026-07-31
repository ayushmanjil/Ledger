import { Handshake, Trash2, CalendarDays } from 'lucide-react';
import { LeatherCard } from '../ui/LeatherCard';
import { GlassButton } from '../ui/GlassButton';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Debt } from '@/types';

interface DebtCardProps {
  debt: Debt;
  onPay: (debt: Debt) => void;
  onDelete: (debt: Debt) => void;
}

export function DebtCard({ debt, onPay, onDelete }: DebtCardProps) {
  const isBorrowed = debt.type === 'borrowed';
  const progress = Math.min(100, Math.max(0, (debt.paid_amount / debt.amount) * 100));
  const remaining = debt.amount - debt.paid_amount;
  const isSettled = debt.status === 'settled';

  return (
    <LeatherCard>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="leather-emboss-icon w-10 h-10 rounded-xl flex items-center justify-center text-gold-300">
            <Handshake size={20} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-cream-50 text-base">{debt.person_name}</h3>
            <p className="text-xs text-cream-50/50 uppercase tracking-wide">
              {isBorrowed ? 'Payable' : 'Receivable'}
            </p>
          </div>
        </div>
        <button onClick={() => onDelete(debt)} className="text-cream-50/30 hover:text-red-400 transition-colors">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-end mb-1">
          <p className="text-2xl font-display font-semibold text-cream-50">
            {formatCurrency(remaining)} <span className="text-sm font-body text-cream-50/50 font-normal">left</span>
          </p>
          <p className="text-sm text-cream-50/70">
            {formatCurrency(debt.paid_amount)} / {formatCurrency(debt.amount)}
          </p>
        </div>
        <div className="h-2 rounded-full bg-black/40 overflow-hidden shadow-inner border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isSettled ? 'bg-green-500' : (isBorrowed ? 'bg-red-500' : 'bg-gold-500')}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {debt.due_date && (
        <div className="flex items-center gap-1.5 text-xs text-cream-50/60 mb-4">
          <CalendarDays size={13} />
          Due {formatDate(debt.due_date)}
        </div>
      )}

      {debt.note && <p className="text-sm text-cream-50/60 mb-4 italic">"{debt.note}"</p>}

      {!isSettled && (
        <GlassButton variant="primary" onClick={() => onPay(debt)} full>
          Record Payment
        </GlassButton>
      )}
      {isSettled && (
        <div className="w-full text-center text-sm font-semibold text-green-400 uppercase tracking-widest py-2 border border-green-500/20 rounded-xl bg-green-500/10">
          Settled
        </div>
      )}
    </LeatherCard>
  );
}
