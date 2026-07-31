import { useState } from 'react';
import {
  Wallet as WalletIcon, Landmark, Smartphone, CreditCard, PiggyBank, Star, Trash2,
  ChevronDown, ChevronUp, Calendar, CheckCircle2, XCircle, Sliders
} from 'lucide-react';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { GlassButton } from '@/components/ui/GlassButton';
import { formatCurrency, formatDate, formatMonthLabel, currentMonth, getMonthList } from '@/utils/format';
import { isWalletIncludedInMonth } from '@/firebase/dashboard';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '@/components/ui/Toast';
import type { Wallet } from '@/types';

const TYPE_ICON: Record<string, any> = {
  cash: WalletIcon, bank: Landmark, upi: Smartphone, credit_card: CreditCard, savings: PiggyBank, custom: Star,
};

export function WalletCard({ wallet, spent, onDelete }: {
  wallet: Wallet;
  spent: number;
  onDelete: (w: Wallet) => void;
}) {
  const { toggleWalletMonthOptOut, updateWallet } = useFinanceStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTogglingGlobal, setIsTogglingGlobal] = useState(false);

  const Icon = TYPE_ICON[wallet.type] ?? WalletIcon;
  const hasAllocation = wallet.allocatedAmount > 0;
  const pct = hasAllocation ? Math.min(100, (spent / wallet.allocatedAmount) * 100) : 0;

  // List of recent 5 months to show budget inclusion status
  const months = getMonthList(currentMonth(), 3, 2);

  const handleToggleGlobalInclude = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTogglingGlobal(true);
    try {
      await updateWallet(wallet.id, { includeInBudget: !wallet.includeInBudget });
      toast(`Global budget inclusion for "${wallet.name}" set to ${!wallet.includeInBudget ? 'Enabled' : 'Disabled'}.`, 'info');
    } catch {
      toast('Failed to update wallet budget setting.', 'error');
    } finally {
      setIsTogglingGlobal(false);
    }
  };

  const handleToggleMonthOptOut = async (e: React.MouseEvent, m: string) => {
    e.stopPropagation();
    try {
      await toggleWalletMonthOptOut(wallet.id, m);
      const isCurrentlyIncluded = isWalletIncludedInMonth(wallet, m);
      toast(
        isCurrentlyIncluded
          ? `Opted out "${wallet.name}" from ${formatMonthLabel(m)} budget.`
          : `Included "${wallet.name}" in ${formatMonthLabel(m)} budget.`,
        'success'
      );
    } catch {
      toast('Failed to update month budget setting.', 'error');
    }
  };

  return (
    <LeatherCard className="transition-all duration-200">
      {/* Header & Overview Section */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="leather-emboss-icon w-10 h-10 rounded-xl flex items-center justify-center text-gold-300">
            <Icon size={18} />
          </div>
          <div>
            <p className="font-medium text-cream-50">{wallet.name}</p>
            <Badge tone="neutral">{wallet.type.replace('_', ' ')}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(wallet);
            }}
            className="text-cream-50/30 hover:text-red-300 p-1"
            title="Delete wallet"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {hasAllocation ? (
        <>
          <p className="text-xs text-cream-50/50 uppercase tracking-wide mb-0.5">Remaining Balance</p>
          <p className="font-display text-2xl font-semibold text-cream-50 mb-1">{formatCurrency(wallet.balance)}</p>
          <ProgressBar value={pct} height="sm" className="mt-3" />
          <p className="text-xs text-cream-50/45 mt-2">
            {formatCurrency(spent)} spent of {formatCurrency(wallet.allocatedAmount)}
          </p>
        </>
      ) : (
        <>
          <p className="text-xs text-cream-50/50 uppercase tracking-wide mb-0.5">Balance</p>
          <p className="font-display text-2xl font-semibold text-cream-50 mb-1">{formatCurrency(wallet.balance)}</p>
        </>
      )}

      {/* Expand / Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-gold-300/80 hover:text-gold-300 transition-colors"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Sliders size={13} /> {isExpanded ? 'Hide Details & Budget Info' : 'Expand Details & Budget Info'}
        </span>
        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-4 text-xs">
          {/* Metadata Info */}
          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/5 border border-white/10 text-cream-50/70">
            <div>
              <span className="text-[11px] text-cream-50/40 block">Created On</span>
              <span className="font-medium text-cream-50">{wallet.createdAt ? formatDate(wallet.createdAt) : 'N/A'}</span>
            </div>
            <div>
              <span className="text-[11px] text-cream-50/40 block">Total Spent</span>
              <span className="font-medium text-cream-50">{formatCurrency(spent)}</span>
            </div>
          </div>

          {/* Global Budget Inclusion Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div>
              <p className="font-medium text-cream-50">Global Budget Inclusion</p>
              <p className="text-[11px] text-cream-50/50">Include in monthly budget by default</p>
            </div>
            <GlassButton
              size="sm"
              variant={wallet.includeInBudget ? 'primary' : 'ghost'}
              onClick={handleToggleGlobalInclude}
              disabled={isTogglingGlobal}
              className="text-[11px] px-2.5 py-1"
            >
              {wallet.includeInBudget ? 'Enabled' : 'Disabled'}
            </GlassButton>
          </div>

          {/* Monthly Budget Breakdown & Opt-Out Controls */}
          <div>
            <p className="font-semibold text-cream-50 mb-1.5 flex items-center gap-1.5">
              <Calendar size={13} className="text-gold-300" /> Monthly Budget Inclusion
            </p>
            <p className="text-[11px] text-cream-50/50 mb-3 leading-relaxed">
              When included, expense transactions from this wallet in a given month are deducted from that month's monthly budget.
            </p>

            <div className="flex flex-col gap-2">
              {months.map((m) => {
                const isIncluded = isWalletIncludedInMonth(wallet, m);
                const isCurrent = m === currentMonth();
                return (
                  <div
                    key={m}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
                      isIncluded
                        ? 'bg-gold-300/10 border-gold-300/25 text-cream-50'
                        : 'bg-white/5 border-white/10 text-cream-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-medium">
                        {isIncluded ? (
                          <CheckCircle2 size={13} className="text-gold-300" />
                        ) : (
                          <XCircle size={13} className="text-cream-50/40" />
                        )}
                        <span>{formatMonthLabel(m)}</span>
                        {isCurrent && <span className="text-[10px] bg-gold-300/20 text-gold-300 px-1.5 py-0.2 rounded font-normal">Current</span>}
                      </div>
                      <p className="text-[10px] text-cream-50/50 mt-0.5">
                        {isIncluded
                          ? 'Included in budget (expenses deducted from monthly budget)'
                          : 'Opted out of this month\'s budget'}
                      </p>
                    </div>

                    <GlassButton
                      size="sm"
                      variant={isIncluded ? 'ghost' : 'primary'}
                      onClick={(e) => handleToggleMonthOptOut(e, m)}
                      className="text-[11px] py-0.5 px-2 h-7"
                    >
                      {isIncluded ? 'Opt Out' : 'Include'}
                    </GlassButton>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </LeatherCard>
  );
}


