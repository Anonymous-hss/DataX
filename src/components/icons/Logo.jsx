import React from 'react';

/**
 * Official DataX Logo matching user-provided brand mark
 * Blue squircle container with white solid diagonal and dual volt-green parallelograms
 */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      {/* Brand Blue Squircle Container */}
      <rect width="64" height="64" rx="16" fill="#2D55F5" />

      {/* Main Solid White Diagonal Bar (Bottom-Left to Top-Right) */}
      <polygon
        points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5"
        fill="#FFFFFF"
      />

      {/* Upper-Left Volt Green Parallelogram */}
      <polygon
        points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5"
        fill="#D4FF3A"
      />

      {/* Lower-Right Volt Green Parallelogram */}
      <polygon
        points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5"
        fill="#D4FF3A"
      />
    </svg>
  );
}

export { Logo };
