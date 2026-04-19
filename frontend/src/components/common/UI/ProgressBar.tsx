import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="w-full bg-[rgb(var(--color-border))] rounded-md h-3 overflow-hidden">
      <div className="h-3 bg-[rgb(var(--color-primary))] transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
};

export default ProgressBar;
