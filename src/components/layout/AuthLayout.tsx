import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-leather-grad opacity-40" />
      <motion.div
        className="leather-surface w-full max-w-md p-8"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="leather-stitch" />
        <div className="relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              className="w-16 h-16 mb-4 animate-float flex items-center justify-center"
            >
              <Logo className="w-16 h-16" />
            </motion.div>
            <h1 className="font-display text-2xl font-semibold text-cream-50">{title}</h1>
            <p className="text-sm text-cream-50/55 mt-1">{subtitle}</p>
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
