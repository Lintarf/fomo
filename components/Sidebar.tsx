import React from 'react';
import { HomeIcon, ClockIcon, CalendarIcon, DashboardIcon, SettingsIcon, SunIcon, PositionTraderIcon, EconomicCalendarIcon, PortfolioIcon } from './Icons';
import { AppMode, ApiStatus } from '../types';
import ThemeToggle from './ThemeToggle';
import ApiStatusIndicator from './ApiStatus';

interface SidebarProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  apiStatus: ApiStatus;
  sessionTokens: number;
  totalTokens: number;
}

const NavItem: React.FC<{
  mode: AppMode;
  activeMode: AppMode;
  onClick: (mode: AppMode) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ mode, activeMode, onClick, icon, label }) => (
  <li>
    <button
      onClick={() => onClick(mode)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        activeMode === mode
          ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </button>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ activeMode, onModeChange, theme, setTheme, apiStatus, sessionTokens, totalTokens }) => {
  return (
    <aside className="w-full lg:w-64 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col">
      <div className="mb-6 px-2">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">FOMO AI</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Trading Analyst</p>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
            <NavItem
                mode="home"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<HomeIcon className="h-5 w-5" />}
                label="Home"
            />
            <NavItem
                mode="dashboard"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<DashboardIcon className="h-5 w-5" />}
                label="Dashboard"
            />
            <NavItem
                mode="portfolio"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<PortfolioIcon className="h-5 w-5" />}
                label="Portfolio"
            />
            <NavItem
                mode="economic-calendar"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<EconomicCalendarIcon className="h-5 w-5" />}
                label="Economic Calendar"
            />
            <div className="py-2">
                <div className="border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Trading Modes</div>
            <NavItem
                mode="scalp"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<ClockIcon className="h-5 w-5" />}
                label="Scalp Trading"
            />
            <NavItem
                mode="day"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<SunIcon className="h-5 w-5" />}
                label="Day Trading"
            />
            <NavItem
                mode="swing"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<CalendarIcon className="h-5 w-5" />}
                label="Swing Trading"
            />
            <NavItem
                mode="position"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<PositionTraderIcon className="h-5 w-5" />}
                label="Position Trading"
            />
            <div className="py-2">
                <div className="border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <NavItem
                mode="settings"
                activeMode={activeMode}
                onClick={onModeChange}
                icon={<SettingsIcon className="h-5 w-5" />}
                label="Settings"
            />
        </ul>
      </nav>
      <div className="mt-6 space-y-4">
        <ApiStatusIndicator apiStatus={apiStatus} sessionTokens={sessionTokens} totalTokens={totalTokens} />
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>
    </aside>
  );
};

export default Sidebar;