import React from 'react';

const colorClasses = {
  primary: 'bg-[#2D55F5]',
  warning: 'bg-[#A35600]',
};

export default function ProgressBar({
  value = 0,
  color = 'primary',
  className = '',
}) {
  const clamped = Math.min(100, Math.max(0, Number(value) || 0));
  const currentColor = colorClasses[color] || colorClasses.primary;

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`bg-[#EDEFF5] rounded-full h-1.5 w-full overflow-hidden ${className}`}
    >
      <div
        className={`rounded-full h-1.5 transition-all duration-300 ${currentColor}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { ProgressBar };
