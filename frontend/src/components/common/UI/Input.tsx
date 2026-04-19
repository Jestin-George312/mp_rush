import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input: React.FC<InputProps> = ({ label, className, ...rest }) => {
  const base = 'w-full bg-[rgb(var(--color-input))] border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-0 transition-colors';
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">{label}</label>}
      <input className={[base, className].filter(Boolean).join(' ')} {...rest} />
    </div>
  );
};

export default Input;
