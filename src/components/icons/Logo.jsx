import React from 'react';

/**
 * Official DataX Logo (Adobe Spectrum / Studio Minimal Edition)
 * Zero harsh neon greens. Refined Spectrum Blue squircle with clean white and ice-blue facets.
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
      <defs>
        <linearGradient id="datax-logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1473E6" />
          <stop offset="1" stopColor="#1952B3" />
        </linearGradient>
      </defs>

      {/* Brand Spectrum Blue Squircle */}
      <rect width="64" height="64" rx="16" fill="url(#datax-logo-bg)" />

      {/* Main Solid White Diagonal Bar */}
      <polygon
        points="14.5,49.5 24.5,49.5 49.5,14.5 39.5,14.5"
        fill="#FFFFFF"
      />

      {/* Upper-Left Ice-Blue Facet */}
      <polygon
        points="14.5,14.5 24.5,14.5 31.5,24.5 21.5,24.5"
        fill="#A5C8FF"
      />

      {/* Lower-Right Soft Periwinkle Facet */}
      <polygon
        points="32.5,39.5 42.5,39.5 49.5,49.5 39.5,49.5"
        fill="#A5C8FF"
      />
    </svg>
  );
}

export { Logo };
