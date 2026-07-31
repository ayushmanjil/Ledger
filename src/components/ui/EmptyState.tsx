import { type ReactNode } from 'react';
import { GlassButton } from './GlassButton';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="leather-emboss-icon rounded-2xl p-4 mb-4 text-gold-300">{icon}</div>
      <h3 className="font-display text-lg text-cream-50 mb-1">{title}</h3>
      <p className="text-sm text-cream-50/55 max-w-xs mb-5">{description}</p>
      {actionLabel && onAction && (
        <GlassButton variant="primary" onClick={onAction}>{actionLabel}</GlassButton>
      )}
    </div>
  );
}
