import React from 'react';
import { motion } from 'framer-motion';

/**
 * OnboardingLoader - Smooth Intermediate Await Loader (Requirement 4)
 */
export default function OnboardingLoader({ title, subtitle }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="py-14 px-6 flex flex-col items-center justify-center text-center space-y-4"
    >
      {/* Dual Ring Spinner with Brand Colors */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-3 border-[#2D55F5]/20 border-t-[#2D55F5] animate-spin" />
        <div className="absolute inset-1.5 rounded-full border-2 border-[#D4FF3A]/30 border-b-[#D4FF3A] animate-spin [animation-duration:1.5s]" />
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-bold text-[#0A0F1F] dark:text-white">
          {title}
        </h3>
        <p className="text-xs text-[#5F6678] dark:text-slate-400 font-mono max-w-sm mx-auto">
          {subtitle}
        </p>
      </div>

      <div className="w-48 h-1 bg-[#EDEFF5] dark:bg-white/[0.08] rounded-full overflow-hidden mt-2">
        <div className="h-full bg-gradient-to-r from-[#2D55F5] to-[#D4FF3A] rounded-full animate-pulse w-3/4" />
      </div>
    </motion.div>
  );
}

