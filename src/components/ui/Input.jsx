import React from 'react';

export default function Input({
  icon,
  iconRight,
  placeholder,
  value,
  onChange,
  className = '',
  focused = false,
  type = 'text',
  disabled = false,
  ...props
}) {
  const focusClasses = focused
    ? 'border-[#2D55F5] ring-[3px] ring-[rgba(45,85,245,0.22)]'
    : 'border-[#CDD2DE] focus:border-[#2D55F5] focus:ring-[3px] focus:ring-[rgba(45,85,245,0.22)]';

  const paddingLeft = icon ? 'pl-9' : 'px-3';
  const paddingRight = iconRight ? 'pr-9' : 'px-3';

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      {icon && (
        <span className="absolute left-3 flex items-center justify-center text-[#5F6678] pointer-events-none shrink-0">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-10 bg-white border rounded-[10px] text-sm font-sans text-[#0A0F1F] placeholder:text-[#A6ADC2] outline-none transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${paddingLeft} ${paddingRight} ${focusClasses}`}
        {...props}
      />
      {iconRight && (
        <span className="absolute right-3 flex items-center justify-center text-[#5F6678] shrink-0">
          {iconRight}
        </span>
      )}
    </div>
  );
}

export { Input };
