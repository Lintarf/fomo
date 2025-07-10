import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { UserIcon, SettingsIcon, LogoutIcon } from './Icons';
import { AppMode } from '../types';

interface UserMenuProps {
    user: User | null;
    onNavigate: (mode: AppMode) => void;
    onLogoutClick: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onNavigate, onLogoutClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <UserIcon className="h-6 w-6" />
                <span className="sr-only">Open user menu</span>
            </button>
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu-button"
                >
                    <div className="py-1" role="none">
                        <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate" role="none">
                                Signed in as
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 truncate" role="none">
                                {user.email}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                onNavigate('settings');
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                            <SettingsIcon className="w-5 h-5" />
                            <span>Profile & Settings</span>
                        </button>
                        <button
                            onClick={() => {
                                onLogoutClick();
                                setIsOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700"
                            role="menuitem"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserMenu;
