import React from 'react';

/**
 * DataX Ambient Background Flow Component (Adobe Studio Aesthetic)
 * Soft, slow-drifting, low-opacity mesh gradient orbs that give depth and life
 * to the workspace canvas without visual clutter or distraction.
 */
export default function AmbientBackgroundFlow() {
  return (
    <div 
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-60 dark:opacity-40 transition-opacity duration-1000"
      aria-hidden="true"
    >
      {/* Top-Right Spectrum Blue Drifting Light Field */}
      <div 
        className="ambient-orb-1 absolute -top-40 -right-40 w-[640px] h-[640px] rounded-full blur-[120px] bg-gradient-to-br from-[#1473E6]/15 via-[#3B82F6]/8 to-transparent" 
      />

      {/* Bottom-Left Soft Iris Drifting Light Field */}
      <div 
        className="ambient-orb-2 absolute -bottom-40 -left-40 w-[580px] h-[580px] rounded-full blur-[130px] bg-gradient-to-tr from-[#6E5DC6]/12 via-[#8B77E8]/6 to-transparent" 
      />

      {/* Center Ambient Fill for Studio Depth */}
      <div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[350px] rounded-full blur-[150px] bg-[#1473E6]/4 dark:bg-[#1473E6]/3" 
      />
    </div>
  );
}
