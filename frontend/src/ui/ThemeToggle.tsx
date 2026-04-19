import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={!isLight}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="relative inline-flex items-center h-9 w-20 rounded-full border-4 border-[rgb(var(--color-border))] bg-[rgb(var(--color-toggleBg))] shadow-[inset_0_6px_18px_rgba(0,0,0,0.12)] transition-colors focus:outline-none focus:ring-2 focus:ring-[rgb(var(--color-primary))]"
    >
      <span
        className={
          `absolute top-1/2 -translate-y-1/2 left-1 h-6 w-6 rounded-full bg-white shadow-[0_10px_18px_rgba(0,0,0,0.25)] transform transition-transform ${isLight ? 'translate-x-0' : 'translate-x-10'}`
        }
      />
      <span className={`${isLight ? 'ml-auto mr-2' : 'ml-1.5 mr-1.5'} text-xs font-bold tracking-wider text-[rgb(var(--color-text))]`}>
        {isLight ? 'LIGHT' : 'DARK'}
      </span>
    </button>
  );
};

export default ThemeToggle;
