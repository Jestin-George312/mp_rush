import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, className, rows = 4, ...rest }) => {
  const base = 'w-full bg-[rgb(var(--color-input))] border-[rgb(var(--color-border))] rounded-md px-3 py-2 text-sm text-[rgb(var(--color-text))] placeholder:text-[rgb(var(--color-muted))] focus:outline-none focus:ring-0 transition-colors';
  return (
    <div>
      {label && <label className="block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]">{label}</label>}
      <textarea rows={rows} className={[base, className].filter(Boolean).join(' ')} {...rest} />
    </div>
  );
};

export default Textarea;
