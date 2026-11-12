import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

/**
 * Illustrated Animated Success Orb with floating orbital badges matching design spec
 */
export default function DryRunOrbGraphic() {
  return (
    <motion.div 
      animate={{ y: [-2.5, 2.5, -2.5] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-16 h-16 shrink-0 flex items-center justify-center select-none"
    >
      {/* Outer concentric soft green discs */}
      <div className="absolute inset-0 rounded-full bg-[#EAF7EE] dark:bg-emerald-950/30" />
      <div className="absolute inset-1.5 rounded-full border border-[#BDE8CC]/80 dark:border-emerald-800/40" />

      {/* Center green checkmark circle */}
      <div className="relative z-10 w-10 h-10 rounded-full bg-[#127A52] border-2 border-[#0D5B3D] flex items-center justify-center shadow-xs">
        <Check className="w-5 h-5 text-white stroke-[3.2]" />
      </div>

      {/* Floating Capsule Badge: Top-Left */}
      <motion.div
        animate={{ y: [-1.5, 1.5, -1.5], x: [1, -1, 1] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1 -left-1.5 z-20 px-1.5 py-0.5 rounded-full bg-white dark:bg-[#18181C] border border-[#0A0F1F] dark:border-white/80 shadow-2xs flex items-center gap-1"
      >
        <span className="w-2 h-2 rounded-full bg-[#127A52]" />
        <span className="w-3.5 h-1.5 rounded-full bg-[#C7D2FE]" />
      </motion.div>

      {/* Floating Capsule Badge: Bottom-Right */}
      <motion.div
        animate={{ y: [1.5, -1.5, 1.5], x: [-1, 1, -1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -bottom-1 -right-1.5 z-20 px-1.5 py-0.5 rounded-full bg-white dark:bg-[#18181C] border border-[#0A0F1F] dark:border-white/80 shadow-2xs flex items-center gap-1"
      >
        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
        <span className="w-3.5 h-1.5 rounded-full bg-[#C7D2FE]" />
      </motion.div>

      {/* Top-Right Lime Square Accent */}
      <motion.span
        animate={{ scale: [1, 1.1, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1.5 right-0.5 z-10 w-2.5 h-2.5 rounded-[4px] bg-[#D9F99D] border border-[#0A0F1F]"
      />

      {/* Left Green Accent Dot */}
      <span className="absolute top-7 -left-0.5 w-1.5 h-1.5 rounded-full bg-[#22C55E]" />

      {/* Right Blue Accent Dot */}
      <span className="absolute top-6 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#2563EB]" />

      {/* Bottom-Left Blue Accent Box */}
      <span className="absolute bottom-2 left-0 w-1.5 h-1.5 rounded-[2px] bg-[#2563EB]" />
    </motion.div>
  );
}
export { DryRunOrbGraphic };

