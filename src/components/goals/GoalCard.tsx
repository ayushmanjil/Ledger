import { useState } from 'react';
import { Target, Trash2, PlusCircle } from 'lucide-react';
import { LeatherCard } from '@/components/ui/LeatherCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { GlassButton } from '@/components/ui/GlassButton';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Input';
import { formatCurrency, formatDate, toPaise } from '@/utils/format';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '@/components/ui/Toast';
import type { SavingsGoal } from '@/types';

export function GoalCard({ goal, onDelete }: { goal: SavingsGoal; onDelete: (g: SavingsGoal) => void }) {
  const { contributeToGoal } = useFinanceStore();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const pct = goal.targetAmount > 0 ? Math.min(100, (goal.savedAmount / goal.targetAmount) * 100) : 0;
  const done = pct >= 100;

  const contribute = async () => {
    if (!amount || Number(amount) <= 0) return;
    await contributeToGoal(goal.id, toPaise(Number(amount)));
    toast(`Added ${formatCurrency(toPaise(Number(amount)))} to "${goal.title}"`, 'success');
    setAmount('');
    setOpen(false);
  };

  return (
    <LeatherCard variant={done ? 'olive' : 'brown'}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="leather-emboss-icon w-10 h-10 rounded-xl flex items-center justify-center text-gold-300">
            <Target size={18} />
          </div>
          <div>
            <p className="font-medium text-cream-50">{goal.title}</p>
            <p className="text-xs text-cream-50/45">Due {formatDate(goal.deadline)}</p>
          </div>
        </div>
        <button onClick={() => onDelete(goal)} className="text-cream-50/30 hover:text-red-300">
          <Trash2 size={15} />
        </button>
      </div>
      <ProgressBar value={pct} tone={done ? 'success' : 'default'} />
      <div className="flex justify-between mt-3 text-sm mb-4">
        <span className="text-cream-50/60">{formatCurrency(goal.savedAmount)} saved</span>
        <span className="text-gold-300 font-medium">{Math.round(pct)}% · {formatCurrency(goal.targetAmount)}</span>
      </div>
      {!done && (
        <GlassButton size="sm" full onClick={() => setOpen(true)}>
          <PlusCircle size={14} /> Contribute
        </GlassButton>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`Contribute to ${goal.title}`} size="sm">
        <div className="flex flex-col gap-4">
          <Field label="Amount (₹)">
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </Field>
          <GlassButton variant="primary" full onClick={contribute}>Add contribution</GlassButton>
        </div>
      </Modal>
    </LeatherCard>
  );
}
