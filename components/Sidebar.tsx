import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
    HomeIcon, 
    DashboardIcon, 
    PortfolioIcon, 
    SettingsIcon, 
    CommunityIcon,
    EconomicCalendarIcon,
    AiIcon
} from './Icons';

interface SidebarProps {
    user: any;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, sidebarOpen, setSidebarOpen }) => {
    const location = useLocation();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
        { name: 'Trading Analysis', href: '/trading', icon: AiIcon },
        { name: 'Portfolio', href: '/portfolio', icon: PortfolioIcon },
        { name: 'Community', href: '/community', icon: CommunityIcon },
        { name: 'Economic Calendar', href: '/economic-calendar', icon: EconomicCalendarIcon },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
    ];

    const isActive = (href: string) => {
        return location.pathname === href;
    };

    return (
        <>
            {/* Sidebar mobile overlay */}
            <div
                className={`fixed inset-0 z-40 bg-black bg-opacity-40 transition-opacity duration-300 ${sidebarOpen ? 'block' : 'hidden'}`}
                onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}
            >
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                    <Link to="/" className="flex items-center" onClick={() => setSidebarOpen(false)}>
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 text-white font-bold text-lg">F</div>
                        <span className="ml-2 text-xl font-bold text-slate-800 dark:text-slate-100">FOMO AI</span>
                    </Link>
                    <button onClick={() => setSidebarOpen(false)} className="text-slate-500 dark:text-slate-300 hover:text-violet-600 p-2 ml-2">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <nav className="mt-8 flex-1 px-2 space-y-1">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive(item.href)
                                        ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                }`}
                            >
                                <Icon
                                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                                        isActive(item.href)
                                            ? 'text-violet-500 dark:text-violet-400'
                                            : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                                    }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                {user && (
                    <div className="flex-shrink-0 flex border-t border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-medium">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.email}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Trader</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Sidebar desktop */}
            <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50 lg:bg-white lg:border-r lg:border-slate-200 dark:lg:bg-slate-900 dark:lg:border-slate-700">
                <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4">
                        <Link to="/" className="flex items-center">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-600 text-white font-bold text-lg">F</div>
                            <span className="ml-2 text-xl font-bold text-slate-800 dark:text-slate-100">FOMO AI</span>
                        </Link>
                    </div>
                    <nav className="mt-8 flex-1 px-2 space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive(item.href)
                                            ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/50 dark:text-violet-100'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                                    }`}
                                >
                                    <Icon
                                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                                            isActive(item.href)
                                                ? 'text-violet-500 dark:text-violet-400'
                                                : 'text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-400'
                                        }`}
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                {user && (
                    <div className="flex-shrink-0 flex border-t border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-violet-600 text-white flex items-center justify-center text-sm font-medium">
                                    {user.email?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.email}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Trader</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Tombol hamburger untuk mobile, letakkan di header/topbar layout utama */}
            {/* <button onClick={() => setSidebarOpen(true)} className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-white dark:bg-slate-800 rounded-full shadow border border-slate-200 dark:border-slate-700">
                <svg className="h-6 w-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button> */}
        </>
    );
};

export default Sidebar;