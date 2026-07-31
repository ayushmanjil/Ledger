import { useForm } from 'react-hook-form';
import { Modal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Input';
import { GlassButton } from '@/components/ui/GlassButton';
import { useFinanceStore } from '@/store/financeStore';
import { toPaise } from '@/utils/format';
import { toast } from '@/components/ui/Toast';

interface FormValues { title: string; targetAmount: number; deadline: string; }

export function CreateGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addGoal } = useFinanceStore();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (values: FormValues) => {
    await addGoal({
      title: values.title,
      targetAmount: toPaise(Number(values.targetAmount)),
      deadline: values.deadline,
      icon: 'target',
    });
    toast('Savings goal created', 'success');
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New savings goal" size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field label="Goal title">
          <Input placeholder="e.g. New Laptop" {...register('title', { required: true })} />
        </Field>
        <Field label="Target amount (₹)">
          <Input type="number" step="0.01" {...register('targetAmount', { required: true, min: 1 })} />
        </Field>
        <Field label="Deadline">
          <Input type="date" {...register('deadline', { required: true })} />
        </Field>
        <GlassButton type="submit" variant="primary" full disabled={isSubmitting}>Create goal</GlassButton>
      </form>
    </Modal>
  );
}
