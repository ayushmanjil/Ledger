import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Field, Input, Select } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { toPaise, todayISO } from '@/utils/format';
import { toast } from '@/components/ui/Toast';

interface FormValues { fromWalletId: string; toWalletId: string; amount: number; note: string; }

export function TransferModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { wallets, transferFunds } = useFinanceStore();
  const { register, handleSubmit, reset, watch, formState: { isSubmitting, errors } } = useForm<FormValues>();
  const from = watch('fromWalletId');

  const onSubmit = async (values: FormValues) => {
    if (String(values.fromWalletId) === String(values.toWalletId)) {
      toast('Choose two different wallets', 'error');
      return;
    }
    await transferFunds(values.fromWalletId, values.toWalletId, toPaise(Number(values.amount)), values.note);
    toast('Transfer complete', 'success');
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Transfer between wallets" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="From wallet">
          <Select {...register('fromWalletId', { required: true })}>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </Field>
        <Field label="To wallet">
          <Select {...register('toWalletId', { required: true })}>
            {wallets.filter((w) => String(w.id) !== String(from)).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </Field>
        <Field label="Amount (₹)" error={errors.amount?.message}>
          <Input type="number" step="0.01" {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Enter a valid amount' } })} />
        </Field>
        <Field label="Note (optional)">
          <Input placeholder="Reason for transfer" {...register('note')} />
        </Field>
        <input type="hidden" defaultValue={todayISO()} />
        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>Transfer funds</GlassButton>
      </form>
    </Modal>
  );
}
