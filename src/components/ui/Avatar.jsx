import React from 'react';

const sizeMap = {
  24: 'w-6 h-6 text-[10px]',
  28: 'w-7 h-7 text-[11px]',
  32: 'w-8 h-8 text-xs',
  34: 'w-[34px] h-[34px] text-xs',
  36: 'w-9 h-9 text-xs',
  40: 'w-10 h-10 text-sm',
  48: 'w-12 h-12 text-base',
  56: 'w-14 h-14 text-lg',
  64: 'w-16 h-16 text-xl',
};

export default function Avatar({
  size = 34,
  initials = '',
  className = '',
  ...props
}) {
  const sizeClass = sizeMap[size] || 'w-[34px] h-[34px] text-xs';
  const displayInitials = (initials || '').toUpperCase().slice(0, 2);

  return (
    <div
      className={`rounded-full bg-gradient-to-tr from-[#2D55F5] to-[#6085FF] text-white font-medium flex items-center justify-center shrink-0 select-none ${sizeClass} ${className}`}
      {...props}
    >
      {displayInitials}
    </div>
  );
}

export { Avatar };
