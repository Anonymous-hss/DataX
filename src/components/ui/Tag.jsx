import React from 'react';

const variantClasses = {
  success: 'bg-[#E7F6EE] border-[#BFE6D2] text-[#127A52]',
  warning: 'bg-[#FFF4E3] border-[#F7D9AE] text-[#A35600]',
  neutral: 'bg-[#EDEFF5] border-transparent text-[#474E61]',
  primary: 'bg-[#ECF0FF] border-[#C9D5FF] text-[#2D55F5]',
  dark: 'bg-[#2D55F5] border-transparent text-white',
  volt: 'bg-[#D4FF3A] border-transparent text-[#0A0F1F]',
};

const dotColors = {
  success: 'bg-[#127A52]',
  warning: 'bg-[#A35600]',
  neutral: 'bg-[#5F6678]',
  primary: 'bg-[#2D55F5]',
  dark: 'bg-white',
  volt: 'bg-[#0A0F1F]',
};

export default function Tag({
  variant = 'neutral',
  children,
  showDot,
  className = '',
  ...props
}) {
  const currentVariant = variantClasses[variant] || variantClasses.neutral;
  const isDotDefault = ['success', 'warning', 'neutral', 'primary'].includes(variant);
  const hasDot = showDot !== undefined ? Boolean(showDot) : isDotDefault;
  const dotColor = dotColors[variant] || 'bg-current';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium font-sans border select-none ${currentVariant} ${className}`}
      {...props}
    >
      {hasDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {children}
    </span>
  );
}

export { Tag };
