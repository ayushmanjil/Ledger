import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { toPaise } from '@/utils/format';
import { toast } from '@/components/ui/Toast';
import type { WalletType } from '@/types';

interface FormValues { name: string; type: WalletType; allocatedAmount: number; includeInBudget: boolean; }

export function CreateWalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addWallet } = useFinanceStore();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { type: 'cash', includeInBudget: true },
  });

  const onSubmit = async (values: FormValues) => {
    const allocated = toPaise(Number(values.allocatedAmount) || 0);
    await addWallet({
      name: values.name,
      type: values.type,
      allocatedAmount: allocated,
      includeInBudget: Boolean(values.includeInBudget),
      // Start the balance equal to the allocated amount so expenses drain it.
      balance: allocated,
    });
    toast('Wallet created', 'success');
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Create wallet" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Wallet name">
          <Input placeholder="e.g. Vacation Fund" {...register('name', { required: true })} />
        </Field>
        <Field label="Type">
          <Select {...register('type')}>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="upi">UPI</option>
            <option value="credit_card">Credit Card</option>
            <option value="savings">Savings</option>
            <option value="custom">Custom</option>
          </Select>
        </Field>
        <Field label="Amount (₹)">
          <Input type="number" step="0.01" placeholder="0.00" {...register('allocatedAmount')} />
        </Field>
        <label className="flex items-center gap-3 text-sm text-cream-50/80 cursor-pointer">
          <input type="checkbox" className="w-4 h-4 accent-caramel-500" defaultChecked {...register('includeInBudget')} />
          Include in Monthly Budget
        </label>
        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>Create wallet</GlassButton>
      </form>
    </Modal>
  );
}
