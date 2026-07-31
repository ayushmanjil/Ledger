import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Field, Input } from '../ui/Input';
import { GlassButton } from '../ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '../ui/Toast';
import { formatCurrency } from '@/utils/format';
import type { Debt } from '@/types';

export function PayDebtModal({ debt, onClose }: { debt: Debt | null; onClose: () => void }) {
  const { payDebt } = useFinanceStore();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ amount: string }>();

  if (!debt) return null;

  const remaining = (debt.amount - debt.paid_amount) / 100;

  const onSubmit = async (data: { amount: string }) => {
    try {
      const amountPaise = Math.round(Number(data.amount) * 100);
      await payDebt(debt.id, amountPaise);
      toast('Payment recorded', 'success');
      reset();
      onClose();
    } catch {
      toast('Failed to record payment', 'error');
    }
  };

  return (
    <Modal open={!!debt} onClose={onClose} title="Record Payment">
      <div className="mb-5 text-sm text-cream-50/70">
        Recording payment for <strong>{debt.person_name}</strong>. 
        Remaining balance: <strong className="text-cream-50">{formatCurrency(debt.amount - debt.paid_amount)}</strong>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Payment Amount">
          <Input 
            type="number" 
            step="0.01" 
            min="0.01" 
            max={remaining} 
            defaultValue={remaining}
            {...register('amount', { required: true, max: remaining })} 
            autoFocus
          />
        </Field>

        <div className="flex justify-end gap-3 mt-2">
          <GlassButton type="button" variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton type="submit" variant="primary" disabled={isSubmitting}>Record Payment</GlassButton>
        </div>
      </form>
    </Modal>
  );
}
