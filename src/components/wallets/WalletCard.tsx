import { memo } from 'react';
import { Wallet as WalletIcon, Landmark, Smartphone, CreditCard, PiggyBank, Star, Trash2 } from 'lucide-react';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency } from '@/utils/format';
import type { Wallet } from '@/types';

const TYPE_ICON: Record<string, any> = {
  cash: WalletIcon, bank: Landmark, upi: Smartphone, credit_card: CreditCard, savings: PiggyBank, custom: Star,
};

export const WalletCard = memo(function WalletCard({ wallet, spent, onDelete }: {
  wallet: Wallet;
  spent: number;
  onDelete: (w: Wallet) => void;
}) {
  const Icon = TYPE_ICON[wallet.type] ?? WalletIcon;
  const hasAllocation = wallet.allocatedAmount > 0;
  const pct = hasAllocation ? Math.min(100, (spent / wallet.allocatedAmount) * 100) : 0;

  return (
    <LeatherCard>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="leather-emboss-icon w-10 h-10 rounded-xl flex items-center justify-center text-gold-300">
            <Icon size={18} />
          </div>
          <div>
            <p className="font-medium text-cream-50">{wallet.name}</p>
            <Badge tone="neutral">{wallet.type.replace('_', ' ')}</Badge>
          </div>
        </div>
        <button onClick={() => onDelete(wallet)} className="text-cream-50/30 hover:text-red-300">
          <Trash2 size={15} />
        </button>
      </div>

      {hasAllocation ? (
        <>
          <p className="text-xs text-cream-50/50 uppercase tracking-wide mb-0.5">Remaining</p>
          <p className="font-display text-2xl font-semibold text-cream-50 mb-1">{formatCurrency(wallet.balance)}</p>
          <ProgressBar value={pct} height="sm" className="mt-3" />
          <p className="text-xs text-cream-50/45 mt-2">
            {formatCurrency(spent)} spent of {formatCurrency(wallet.allocatedAmount)}
          </p>
        </>
      ) : (
        <p className="font-display text-2xl font-semibold text-cream-50 mb-1">{formatCurrency(wallet.balance)}</p>
      )}

      {!wallet.includeInBudget && (
        <p className="text-[11px] text-cream-50/35 mt-2">Excluded from monthly budget</p>
      )}
    </LeatherCard>
  );
});

