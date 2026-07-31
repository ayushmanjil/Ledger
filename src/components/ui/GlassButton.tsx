import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
}

const sizeMap = {
  sm: 'px-3 py-1.5 text-sm rounded-full',
  md: 'px-5 py-2.5 text-sm rounded-full',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
};

const variantMap = {
  primary: 'text-cream-50 bg-gradient-to-b from-copper-400/40 to-caramel-500/30',
  ghost: 'text-cream-50/90',
  danger: 'text-red-100 bg-gradient-to-b from-red-500/30 to-red-700/20 border-red-300/30',
};

export function GlassButton({
  variant = 'ghost',
  size = 'md',
  full = false,
  className,
  children,
  ...props
}: GlassButtonProps) {
  return (
    <motion.button
      className={cn(
        'glass-surface font-medium tracking-wide inline-flex items-center justify-center gap-2 transition-colors',
        sizeMap[size],
        variantMap[variant],
        full && 'w-full',
        className
      )}
      whileHover={{ y: -2, filter: 'brightness(1.08)' }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
