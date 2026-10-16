import React from 'react';

export default function Segmented({
  options = [],
  value,
  onChange,
  className = '',
}) {
  return (
    <div
      role="group"
      className={`inline-flex items-center bg-[#EDEFF5] rounded-full p-[3px] gap-0.5 select-none ${className}`}
    >
      {options.map((option) => {
        const optionValue = typeof option === 'object' && option !== null ? option.value : option;
        const optionLabel = typeof option === 'object' && option !== null ? option.label : option;
        const isActive = optionValue === value;

        return (
          <button
            key={String(optionValue)}
            type="button"
            onClick={() => onChange?.(optionValue)}
            className={`px-3.5 py-1.5 text-[13px] rounded-full cursor-pointer transition-all duration-150 border-none outline-none ${
              isActive
                ? 'bg-white rounded-full shadow-sm text-[#2D55F5] font-medium'
                : 'text-[#474E61] font-medium hover:text-[#0A0F1F]'
            }`}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented };
