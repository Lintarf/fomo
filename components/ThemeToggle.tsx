import React from 'react';
import { SunIcon, MoonIcon } from './Icons';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 bg-slate-100 dark:bg-slate-700"
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <span className="sr-only">Toggle theme</span>
      <div className="flex items-center justify-between w-full px-2">
          <SunIcon className={`h-5 w-5 ${theme === 'light' ? 'text-yellow-500' : 'text-slate-400'}`} />
          <MoonIcon className={`h-5 w-5 ${theme === 'dark' ? 'text-blue-400' : 'text-slate-400'}`} />
      </div>
      <span
        className={`${
          theme === 'light' ? 'translate-x-1' : 'translate-x-7'
        } absolute top-1 left-0 inline-block h-6 w-6 transform bg-white dark:bg-slate-900 rounded-full shadow-lg transition-transform duration-300 ease-in-out ring-1 ring-slate-900/5`}
      />
    </button>
  );
};

export default ThemeToggle;
