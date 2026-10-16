import React from 'react';
import { Check } from 'lucide-react';

export default function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  className = '',
  id,
  name,
  ...props
}) {
  const handleClick = () => {
    if (disabled) return;
    onChange?.(!checked);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={handleClick}
      id={id}
      name={name}
      className={`relative inline-flex items-center justify-center w-[18px] h-[18px] rounded-[5px] cursor-pointer transition-colors duration-150 outline-none select-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#2D55F5]/30 ${
        checked
          ? 'bg-[#2D55F5] border-[1.5px] border-[#2D55F5] text-white'
          : 'bg-white border-[1.5px] border-[#CDD2DE] hover:border-[#2D55F5]'
      } ${className}`}
      {...props}
    >
      {checked && <Check className="w-3.5 h-3.5 stroke-[2.5] text-white" />}
    </button>
  );
}

export { Checkbox };
