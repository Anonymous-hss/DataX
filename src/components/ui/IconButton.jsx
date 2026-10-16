import React from 'react';

const variantClasses = {
  default: 'hover:bg-[#F5F6FA] text-[#474E61] hover:text-[#0A0F1F]',
  outlined: 'bg-white border border-[#E3E6EE] text-[#474E61] hover:text-[#0A0F1F] hover:bg-[#F5F6FA] shadow-xs',
};

export default function IconButton({
  icon,
  children,
  variant = 'default',
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  ...props
}) {
  const currentVariant = variantClasses[variant] || variantClasses.default;
  const content = icon || children;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer transition-colors duration-150 select-none outline-none disabled:opacity-50 disabled:cursor-not-allowed ${currentVariant} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}

export { IconButton };
