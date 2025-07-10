import React from 'react';
import { AppMode } from '../types';
import ThemeToggle from './ThemeToggle';
import { User } from '@supabase/supabase-js';

interface TopNavbarProps {
    onNavigate: (mode: AppMode) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ onNavigate, theme, setTheme, user, onLoginClick, onLogoutClick }) => {
    
    return (
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-sm">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
                            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">FOMO AI</h1>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Trading Analyst</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate('dashboard')}
                            className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors"
                        >
                            Dashboard
                        </button>
                        
                        {user ? (
                             <button
                                onClick={onLogoutClick}
                                className="text-sm font-medium px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors"
                            >
                                Logout
                            </button>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="text-sm font-medium px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors"
                            >
                                Login
                            </button>
                        )}

                        <ThemeToggle theme={theme} setTheme={setTheme} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;