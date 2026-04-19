import React from 'react';

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ htmlFor, children, className }) => {
  return (
    <label htmlFor={htmlFor} className={['block text-xs font-medium mb-1 text-[rgb(var(--color-muted))]', className].filter(Boolean).join(' ')}>
      {children}
    </label>
  );
};

export default Label;
