import React from 'react';
import { motion } from 'framer-motion';

export default function GreenTickAnimation({ size = 130 }) {
  return (
    <div className="relative flex items-center justify-center my-3" style={{ width: size, height: size }}>
      
      {/* Outer mint circular background container */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-28 h-28 rounded-full bg-[#ecfdf5] border border-emerald-100 flex items-center justify-center relative shadow-xs"
      >
        
        {/* Orbit Ring with rotating colored dots (matching Image 5) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          className="absolute inset-[-10px] rounded-full border border-emerald-300/40 pointer-events-none"
        >
          {/* Green dot at 12 o'clock */}
          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
          
          {/* Blue dot at 4 o'clock */}
          <span className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
          
          {/* Mint/Cyan dot at 8 o'clock */}
          <span className="absolute bottom-3 left-3 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </motion.div>

        {/* Floating pill 1: Top-Left (green dot + bar) - matching Image 4 */}
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="absolute -top-1 -left-5 bg-white px-2 py-1 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-1.5 z-20 pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <div className="w-6 h-1.5 rounded-full bg-slate-200" />
        </motion.div>

        {/* Floating pill 2: Bottom-Right (blue dot + bar) - matching Image 4 */}
        <motion.div
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="absolute -bottom-1 -right-5 bg-white px-2 py-1 rounded-full border border-slate-200/90 shadow-xs flex items-center gap-1.5 z-20 pointer-events-none"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <div className="w-6 h-1.5 rounded-full bg-slate-200" />
        </motion.div>

        {/* Small decorative colored accent dots */}
        <span className="absolute -top-2 right-4 w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="absolute top-4 -right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
        <span className="absolute bottom-6 -left-3 w-1.5 h-1.5 rounded-full bg-blue-500" />

        {/* Center Emerald Circle with Checkmark */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
          className="w-16 h-16 rounded-full bg-[#15803d] flex items-center justify-center shadow-md shadow-emerald-700/25 relative z-10"
        >
          <svg 
            className="w-9 h-9 text-white" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.3 }}
              d="M20 6L9 17l-5-5"
            />
          </svg>
        </motion.div>

      </motion.div>

    </div>
  );
}
