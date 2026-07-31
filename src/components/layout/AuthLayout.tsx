import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

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
              className="leather-emboss-icon w-14 h-14 rounded-2xl flex items-center justify-center mb-4 animate-float"
            >
              <Wallet size={26} className="text-gold-300" />
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
