import React from 'react';

export default function Radio({
  selected = false,
  onChange,
  disabled = false,
  className = '',
  id,
  name,
  ...props
}) {
  const handleClick = () => {
    if (disabled) return;
    onChange?.(!selected);
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={handleClick}
      id={id}
      name={name}
      className={`inline-flex items-center justify-center w-[18px] h-[18px] bg-white rounded-full cursor-pointer transition-all duration-150 outline-none select-none shrink-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#2D55F5]/30 ${
        selected
          ? 'border-[5px] border-[#2D55F5]'
          : 'border-[1.5px] border-[#CDD2DE] hover:border-[#2D55F5]'
      } ${className}`}
      {...props}
    />
  );
}

export { Radio };
