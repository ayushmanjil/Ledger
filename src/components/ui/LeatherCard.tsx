import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';

interface LeatherCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: 'brown' | 'olive';
  stitched?: boolean;
  hoverLift?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  contentClassName?: string;
  children?: React.ReactNode;
}

const paddingMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };

/** True when the primary pointer is a finger/stylus (phone or tablet). */
const isTouchPrimary =
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: coarse)').matches;

/** The base "large container" surface: stitched leather, embossed depth,
 * soft top highlight. Every dashboard/wallet/budget card composes this. */
export function LeatherCard({
  variant = 'brown',
  stitched = true,
  hoverLift = true,
  padding = 'md',
  contentClassName,
  className,
  children,
  ...props
}: LeatherCardProps) {
  return (
    <motion.div
      className={cn(
        variant === 'olive' ? 'leather-surface--olive' : '',
        'leather-surface',
        paddingMap[padding],
        className
      )}
      whileHover={hoverLift && !isTouchPrimary ? { y: -4 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      {...props}
    >
      {stitched && <div className="leather-stitch" />}
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </motion.div>
  );
}
