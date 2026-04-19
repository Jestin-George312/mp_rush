import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

const Select: React.FC<SelectProps> = ({ label, className, children, ...rest }) => {
  const base = 'w-full bg-[rgb(var(--color-input))] border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm text-[rgb(var(--color-text))] focus:outline-none focus:ring-0 transition-colors';
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">{label}</label>}
      <select className={[base, className].filter(Boolean).join(' ')} {...rest}>
        {children}
      </select>
    </div>
  );
};

export default Select;
