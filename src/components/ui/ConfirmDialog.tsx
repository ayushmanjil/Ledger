import { Modal } from './Modal';
import { GlassButton } from './GlassButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <div className="flex gap-3 mb-6">
        {danger && <AlertTriangle className="text-red-300 shrink-0 mt-0.5" size={20} />}
        <p className="text-sm text-cream-50/75">{message}</p>
      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <GlassButton variant="ghost" onClick={onCancel} className="w-full sm:w-auto">Cancel</GlassButton>
        <GlassButton variant={danger ? 'danger' : 'primary'} onClick={onConfirm} className="w-full sm:w-auto">{confirmLabel}</GlassButton>
      </div>
    </Modal>
  );
}
