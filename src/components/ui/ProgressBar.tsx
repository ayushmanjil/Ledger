import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  tone?: 'default' | 'warning' | 'danger' | 'success';
  height?: 'sm' | 'md';
  className?: string;
}

const toneMap = {
  default: 'from-copper-400 to-gold-300',
  warning: 'from-caramel-500 to-gold-300',
  danger: 'from-red-500 to-orange-400',
  success: 'from-olive-500 to-gold-300',
};

export function ProgressBar({ value, tone = 'default', height = 'md', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn(
        'w-full rounded-full overflow-hidden bg-black/30',
        height === 'sm' ? 'h-2' : 'h-3',
        'shadow-emboss-sm',
        className
      )}
    >
      <motion.div
        className={cn('h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(224,184,114,0.5)]', toneMap[tone])}
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}
