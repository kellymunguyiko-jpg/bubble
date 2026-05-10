import React from 'react';
import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const WatermarkButton = () => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
      className="fixed left-6 bottom-6 z-[9999]"
    >
      <Button
        variant="ghost"
        size="sm"
        className="bg-white/90 dark:bg-white/10 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_32px_rgba(0,168,132,0.2)] transition-all gap-3 rounded-2xl h-11 px-5 group active:scale-95"
        onClick={() => window.open('https://kellyseekhelp.netlify.app', '_blank', 'noopener,noreferrer')}
      >
        <div className="flex flex-col items-start leading-tight">
          <span className="text-[10px] font-black text-brand-green uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity">
            Support Link
          </span>
          <span className="text-sm font-bold tracking-tight text-[#111b21] dark:text-white">
            kellyseekhelp
          </span>
        </div>
        <div className="h-7 w-7 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center group-hover:bg-brand-green group-hover:text-white transition-all shadow-inner">
          <ExternalLink className="h-4 w-4" />
        </div>
      </Button>
    </motion.div>
  );
};
