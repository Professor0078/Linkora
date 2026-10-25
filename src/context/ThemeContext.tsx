import React, { createContext, useContext, useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export type ColorMode = 'light' | 'dark';

interface ThemeContextValue {
  colorMode: ColorMode;
  isDark: boolean;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const STORAGE_KEY = 'linkora_color_mode';

function resolveInitialColorMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Ignore storage read restrictions in sandboxed frames
  }
  return 'light';
}

const ThemeContext = createContext<ThemeContextValue>({
  colorMode: 'light',
  isDark: false,
  setColorMode: () => {},
  toggleColorMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    const initial = resolveInitialColorMode();
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', initial === 'dark');
      document.documentElement.style.colorScheme = initial;
    }
    return initial;
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', colorMode === 'dark');
      document.documentElement.style.colorScheme = colorMode;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, colorMode);
    } catch {
      // Ignore storage write errors
    }
  }, [colorMode]);

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
  };

  const toggleColorMode = () => {
    setColorModeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider
      value={{
        colorMode,
        isDark: colorMode === 'dark',
        setColorMode,
        toggleColorMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

interface ThemeToggleButtonProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggleButton({ showLabel = true, className = '' }: ThemeToggleButtonProps) {
  const { isDark, toggleColorMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleColorMode}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${className}`}
    >
      {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
      {showLabel && <span>{isDark ? 'Light' : 'Dark'}</span>}
    </button>
  );
}
