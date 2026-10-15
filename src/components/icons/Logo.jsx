import React from 'react';

export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="32" height="32" rx="8" fill="#2D55F5" />
      <circle cx="8" cy="8" r="2" fill="#D4FF3A" />
      <circle cx="24" cy="24" r="2" fill="#D4FF3A" />
      <path
        d="M10.5 10.5L21.5 21.5M21.5 10.5L10.5 21.5"
        stroke="#FFFFFF"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { Logo };
