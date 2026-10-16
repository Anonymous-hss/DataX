import React from 'react';

const variantClasses = {
  primary: 'bg-[#2D55F5] text-white hover:bg-[#2045DC] active:bg-[#1937B0]',
  secondary: 'bg-white border border-[#CDD2DE] text-[#0A0F1F] shadow-sm hover:bg-[#F5F6FA] hover:border-[#B7BDCE] active:bg-[#EDEFF5]',
  ghost: 'text-[#474E61] hover:text-[#0A0F1F] hover:bg-[#EDEFF5] active:bg-[#E3E6EE]',
  subtle: 'bg-[#ECF0FF] text-[#2D55F5] hover:bg-[#DCE4FF] active:bg-[#CCD8FF]',
  muted: 'bg-[#EDEFF5] text-[#5F6678] hover:bg-[#E3E6EE] hover:text-[#0A0F1F] active:bg-[#D7DCE7]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-4 py-2.5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  ...props
}) {
  const currentVariant = variantClasses[variant] || variantClasses.primary;
  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium font-sans gap-2 rounded-full transition-colors duration-150 select-none outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0 items-center justify-center">{icon}</span>}
      {children && <span>{children}</span>}
      {iconRight && <span className="inline-flex shrink-0 items-center justify-center">{iconRight}</span>}
    </button>
  );
}

export { Button };
