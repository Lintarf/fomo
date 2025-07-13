import React from 'react';
import { AppMode } from '../types';
import { User } from '@supabase/supabase-js';
import { MenuIcon } from './Icons';
import UserMenu from './UserMenu';

interface TopNavbarProps {
    onNavigate: (mode: AppMode) => void;
    user: User | null;
    onLoginClick: () => void;
    onLogoutClick: () => void;
    onMobileMenuToggle?: () => void;
    showUserIcon: boolean;
    activeMode?: AppMode;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ 
    onNavigate, 
    user, 
    onLoginClick, 
    onLogoutClick,
    onMobileMenuToggle,
    showUserIcon,
    activeMode
}) => {
    // Hapus state showUserMenu dan userIconRef
    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-[#202124] shadow-sm border-b border-slate-200 dark:border-[#33343a]">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Mobile Menu Button hanya jika onMobileMenuToggle ada */}
                    {onMobileMenuToggle && (
                        <button
                            onClick={onMobileMenuToggle}
                            className="lg:hidden p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative z-10 cursor-pointer"
                            aria-label="Toggle mobile menu"
                        >
                            <MenuIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                        </button>
                    )}

                    {/* Logo and Title */}
                    <div className="flex-shrink-0 flex items-center">
                        <button onClick={() => onNavigate('home')} className="flex items-center gap-2">
                            <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">FOMO AI</h1>
                            <span className="hidden sm:inline text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Trading Analyst</span>
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-4">
                        {activeMode !== 'dashboard' && (
                            <button
                                onClick={() => onNavigate('dashboard')}
                                className="text-sm font-medium text-slate-600 hover:text-violet-600 dark:text-slate-300 dark:hover:text-violet-400 transition-colors"
                            >
                                Dashboard
                            </button>
                        )}
                        {user ? (
                            <>
                                {/* HAPUS TOMBOL LOGOUT */}
                                {showUserIcon && (
                                    <UserMenu user={user} onLogoutClick={onLogoutClick} onNavigate={onNavigate} />
                                )}
                            </>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="text-sm font-medium px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors"
                            >
                                Login
                            </button>
                        )}
                    </div>

                    {/* Mobile Right Side */}
                    <div className="lg:hidden flex items-center gap-2">
                        {user ? (
                            <>
                                {/* HAPUS TOMBOL LOGOUT */}
                                {showUserIcon && (
                                    <UserMenu user={user} onLogoutClick={onLogoutClick} onNavigate={onNavigate} />
                                )}
                            </>
                        ) : (
                            <button
                                onClick={onLoginClick}
                                className="text-sm font-medium px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200 transition-colors"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopNavbar;