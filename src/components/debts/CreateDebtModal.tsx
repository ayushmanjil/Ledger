import { useForm } from 'react-hook-form';
import { Modal } from '../ui/Modal';
import { Field, Input, Select } from '../ui/Input';
import { GlassButton } from '../ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { toast } from '../ui/Toast';
import type { Debt } from '@/types';

export function CreateDebtModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDebt } = useFinanceStore();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<Partial<Debt>>({
    defaultValues: { type: 'borrowed' }
  });

  const onSubmit = async (data: Partial<Debt>) => {
    try {
      await addDebt({
        ...data,
        amount: Math.round(Number(data.amount) * 100),
      });
      toast('Debt created successfully', 'success');
      reset();
      onClose();
    } catch {
      toast('Failed to create debt', 'error');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Debt / Loan">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Type">
          <Select {...register('type')}>
            <option value="borrowed">I borrowed money (I owe)</option>
            <option value="lent">I lent money (They owe me)</option>
          </Select>
        </Field>
        
        <Field label="Person's Name">
          <Input {...register('person_name', { required: true })} placeholder="e.g. Alice" />
        </Field>

        <Field label="Total Amount">
          <Input type="number" step="0.01" min="0.01" {...register('amount', { required: true })} placeholder="0.00" />
        </Field>

        <Field label="Due Date (Optional)">
          <Input type="date" {...register('due_date')} />
        </Field>

        <Field label="Note (Optional)">
          <Input {...register('note')} placeholder="What was this for?" />
        </Field>

        <div className="flex justify-end gap-3 mt-2">
          <GlassButton type="button" variant="ghost" onClick={onClose}>Cancel</GlassButton>
          <GlassButton type="submit" variant="primary" disabled={isSubmitting}>Save</GlassButton>
        </div>
      </form>
    </Modal>
  );
}
