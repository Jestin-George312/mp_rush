import React from 'react';

interface TabsProps {
  labels: string[];
  active: string;
  onChange: (label: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ labels, active, onChange }) => {
  return (
    <div className="flex gap-4 border-b border-[rgb(var(--color-border))] mb-4">
      {labels.map(label => (
        <button
          key={label}
          onClick={() => onChange(label)}
          className={`py-2 text-sm ${active === label ? 'text-[rgb(var(--color-primary))] border-b-2 border-[rgb(var(--color-primary))]' : 'text-[rgb(var(--color-muted))]'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
