import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored as Theme;
    } catch (e) {
      // ignore
    }
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);

  // Centralized color palettes (RGB triplets) — single source of truth
  const palettes: Record<Theme, Record<string, string>> = {
    light: {
      bg: '255 255 255',
      text: '17 24 39',
      card: '255 255 255',
      input: '248 250 252',
      muted: '100 116 139',
      border: '226 232 240',
      primary: '37 99 235',
      toggleBg: '230 230 230'
    },
    dark: {
      bg: '11 15 25',
      text: '255 255 255',
      card: '17 22 37',
      input: '11 15 25',
      muted: '148 163 184',
      border: '55 65 81',
      primary: '37 99 235',
      toggleBg: '46 52 64'
    }
  };

  // Apply palette as CSS variables on the root element so components can read them
  useEffect(() => {
    const root = document.documentElement;
    const pal = palettes[theme];
    Object.entries(pal).forEach(([key, val]) => {
      root.style.setProperty(`--color-${key}`, val);
    });
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
