import React, { useMemo, useState, useEffect } from 'react';
import { TradeAnalysis, TradingMode, TokenUsage, AppMode, DashboardMode, ApiStatus } from '../types';
import PerformanceCard from './PerformanceCard';
import PerformanceChart from './PerformanceChart';
import TraderProfilePopup from './TraderProfilePopup';
import UserMenu from './UserMenu';
import { User } from '@supabase/supabase-js';
import { CheckCircleIcon, XCircleIcon, TrendingUpIcon, TargetIcon, ClockIcon, CalendarIcon, AiIcon, SpinnerIcon, SunIcon, PositionTraderIcon, CurrencyDollarIcon, ScaleIcon } from './Icons';
import { getTraderProfile } from '../utils/traderProfileHelper';
import { analyzePerformance } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DashboardProps {
    updateTokenUsage: (usage: TokenUsage) => void;
    apiKey: string;
    apiStatus: ApiStatus;
    allTrades: TradeAnalysis[];
    mode: DashboardMode;
    setDashboardSource: (mode: DashboardMode) => void;
    theme: 'light' | 'dark';
    initialCapital: number;
    netPL: number;
    currentEquity: number;
    user: User | null;
    onLogoutClick: () => void;
    onNavigate: (mode: AppMode) => void;
}

const AiAnalysisSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mt-4"></div>
        <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
        </div>
    </div>
);

interface ModeButtonProps {
    buttonMode: DashboardMode;
    activeMode: DashboardMode;
    onClick: (mode: DashboardMode) => void;
    children: React.ReactNode;
}

const ModeButton: React.FC<ModeButtonProps> = ({buttonMode, activeMode, onClick, children}) => (
    <button
        onClick={() => onClick(buttonMode)}
        className={`px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-medium rounded-md transition-colors ${
            activeMode === buttonMode 
            ? 'bg-violet-600 text-white shadow-sm' 
            : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
        }`}
    >
        {children}
    </button>
);


const Dashboard: React.FC<DashboardProps> = ({ updateTokenUsage, apiKey, apiStatus, allTrades, mode, setDashboardSource, theme, initialCapital, netPL, currentEquity, user, onLogoutClick, onNavigate }) => {
    
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(true);
    const [showProfilePopup, setShowProfilePopup] = useState(false);
    // Tambahkan state untuk trigger manual refresh
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const histories = useMemo(() => ({
        scalp: allTrades.filter(t => t.mode === 'scalp'),
        swing: allTrades.filter(t => t.mode === 'swing'),
        day: allTrades.filter(t => t.mode === 'day'),
        position: allTrades.filter(t => t.mode === 'position'),
    }), [allTrades]);

    const activeHistory = useMemo(() => {
        if (mode === 'all') {
            return allTrades;
        }
        return histories[mode as TradingMode];
    }, [mode, allTrades, histories]);

    const traderProfile = useMemo(() => getTraderProfile(allTrades), [allTrades]);
    
    const activeStats = useMemo(() => {
        const completedTrades = activeHistory.filter(t => t.status !== 'pending');
        const wins = completedTrades.filter(t => t.status === 'profit').length;
        const losses = completedTrades.filter(t => t.status === 'stop-loss').length;
        const totalCompleted = wins + losses;
        const winRate = totalCompleted > 0 ? Math.round((wins / totalCompleted) * 100) : 0;

        return {
            winRate,
            wins,
            losses,
            totalCompleted
        };
    }, [activeHistory]);

    // Reset AI analysis and loading state whenever apiKey changes
    useEffect(() => {
        setAiAnalysis('');
        setIsAiLoading(true);
    }, [apiKey]);

    // Kumpulkan statistik summary untuk semua mode
    const modes: DashboardMode[] = ['all', 'scalp', 'day', 'swing', 'position'];
    const modeLabels: Record<DashboardMode, string> = {
        all: 'All', scalp: 'Scalp', day: 'Day', swing: 'Swing', position: 'Position'
    };
    const statsSummary = modes.map(modeKey => {
        const trades = modeKey === 'all' ? allTrades : allTrades.filter(t => t.mode === modeKey);
        const completed = trades.filter(t => t.status !== 'pending');
        const wins = completed.filter(t => t.status === 'profit').length;
        const losses = completed.filter(t => t.status === 'stop-loss').length;
        const totalCompleted = wins + losses;
        const winRate = totalCompleted > 0 ? Math.round((wins / totalCompleted) * 100) : 0;
        const netPL = completed.reduce((acc, trade) => {
            if (trade.status === 'profit') return acc + (trade.outcomeAmount || 0);
            if (trade.status === 'stop-loss') return acc - (trade.outcomeAmount || 0);
            return acc;
        }, 0);
        const initialCap = modeKey === 'all' ? initialCapital : 0;
        const currEquity = modeKey === 'all' ? currentEquity : 0;
        return {
            mode: modeLabels[modeKey],
            initialCapital: initialCap,
            netPL: netPL,
            currentEquity: currEquity,
            totalTrades: trades.length,
            winRate: winRate,
            wins: wins,
            losses: losses,
            completed: totalCompleted
        };
    });

    useEffect(() => {
        if (mode !== 'all') return;
        const fetchAnalysis = async () => {
            if (apiStatus !== 'valid') {
                setAiAnalysis("AI analysis is unavailable. Please set a valid Gemini API key in the settings.");
                setIsAiLoading(false);
                return;
            }
            if (allTrades.length === 0) {
                setAiAnalysis("Belum ada data untuk dianalisis. Lakukan beberapa trade untuk melihat analisis kinerja Anda.");
                setIsAiLoading(false);
                return;
            }
            setIsAiLoading(true);
            try {
                // Kembalikan prompt summary statistik semua mode
                let summaryText = statsSummary.map(s =>
                    `${s.mode}:
- Initial Capital: $${s.initialCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- Net P/L: $${s.netPL >= 0 ? '+' : ''}${s.netPL.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- Current Equity: $${s.currentEquity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
- Total Trades: ${s.totalTrades}
- Win Rate: ${s.winRate}%
- Wins: ${s.wins}
- Losses: ${s.losses}
- Completed: ${s.completed}`
                ).join('\n\n');
                const prompt = `You are an expert trading performance coach. Here are the user's trading statistics for each mode:\n\n${summaryText}\n\nGive a brief summary of the user's overall performance and 1 actionable suggestion for improvement. Do not include any code blocks or JSON.\n\nJawab seluruh analisis dan saran ini dalam bahasa Indonesia yang jelas dan mudah dipahami.`;
                const { analysisText, usage } = await analyzePerformance(apiKey, prompt);
                updateTokenUsage(usage);
                setAiAnalysis(analysisText);
            } catch (error) {
                console.error("Failed to get AI analysis:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.toLowerCase().includes('quota')) {
                    setAiAnalysis("AI analysis failed because the API quota or prompt size has been exceeded. Coba kurangi jumlah trade atau hapus trade dengan rationale sangat panjang.");
                } else {
                    setAiAnalysis(`An error occurred while fetching AI analysis: ${errorMessage}`);
                }
            } finally {
                setIsAiLoading(false);
            }
        };
        fetchAnalysis();
    }, [apiKey, apiStatus, mode, refreshTrigger]);
    
    return (
        <div className="flex-1 flex flex-col gap-6 max-w-screen-xl w-full mx-auto overflow-x-auto">
            {showProfilePopup && (
                <TraderProfilePopup
                    profile={traderProfile}
                    winRate={activeStats.winRate}
                    totalTrades={activeStats.totalCompleted}
                    onClose={() => setShowProfilePopup(false)}
                />
            )}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Your Trading Performance</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Displaying stats for <span className="font-semibold text-violet-600 dark:text-violet-400 capitalize">{mode === 'all' ? 'All' : mode}</span> trading history.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowProfilePopup(true)}
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                       {React.createElement(traderProfile.icon, { className: "w-6 h-6 text-violet-600 dark:text-violet-400" })}
                       <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{traderProfile.tier}</span>
                    </button>
                    <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
                        <ModeButton buttonMode="all" activeMode={mode} onClick={setDashboardSource}>All</ModeButton>
                        <ModeButton buttonMode="scalp" activeMode={mode} onClick={setDashboardSource}>Scalp</ModeButton>
                        <ModeButton buttonMode="day" activeMode={mode} onClick={setDashboardSource}>Day</ModeButton>
                        <ModeButton buttonMode="swing" activeMode={mode} onClick={setDashboardSource}>Swing</ModeButton>
                        <ModeButton buttonMode="position" activeMode={mode} onClick={setDashboardSource}>Position</ModeButton>
                    </div>
                     <UserMenu user={user} onLogoutClick={onLogoutClick} onNavigate={onNavigate} />
                </div>
            </header>

            <main className="flex flex-col gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PerformanceCard
                        label="Initial Capital"
                        value={`$${initialCapital.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        icon={<CurrencyDollarIcon className="w-6 h-6" />}
                        color="violet"
                    />
                    <PerformanceCard
                        label="Net P/L"
                        value={`${netPL >= 0 ? '+' : ''}$${netPL.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        icon={<ScaleIcon className="w-6 h-6" />}
                        color={netPL >= 0 ? "green" : "red"}
                    />
                    <PerformanceCard
                        label="Current Equity"
                        value={`$${currentEquity.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        icon={<CurrencyDollarIcon className="w-6 h-6" />}
                        color="blue"
                    />
                     <PerformanceCard
                        label="Total Trades Analyzed"
                        value={allTrades.length}
                        icon={<TrendingUpIcon className="w-6 h-6" />}
                        color="orange"
                    />
                </div>
                
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <PerformanceCard
                        label="Active Win Rate"
                        value={`${activeStats.winRate}%`}
                        icon={<TargetIcon className="w-6 h-6" />}
                        color="emerald"
                    />
                    <PerformanceCard
                        label="Active Wins"
                        value={activeStats.wins}
                        icon={<CheckCircleIcon className="w-6 h-6" />}
                        color="green"
                    />
                    <PerformanceCard
                        label="Active Losses"
                        value={activeStats.losses}
                        icon={<XCircleIcon className="w-6 h-6" />}
                        color="red"
                    />
                     <PerformanceCard
                        label="Active Completed"
                        value={activeStats.totalCompleted}
                        icon={<ClockIcon className="w-6 h-6" />}
                        color="violet"
                    />
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center mb-4 gap-3">
                        <AiIcon className="h-6 w-6 text-violet-600 dark:text-violet-400 mr-1" />
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">AI Performance Analyst</h3>
                        {mode === 'all' && (
                            <button
                                onClick={() => setRefreshTrigger(t => t + 1)}
                                className="ml-auto px-3 py-1.5 text-xs rounded bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                disabled={isAiLoading}
                                title="Refresh AI Analysis"
                            >
                                Refresh
                            </button>
                        )}
                    </div>
                    {mode === 'all' ? (
                        isAiLoading ? (
                            <AiAnalysisSkeleton />
                        ) : (
                            aiAnalysis && (aiAnalysis.toLowerCase().includes('error') || aiAnalysis.toLowerCase().includes('unavailable') || aiAnalysis.toLowerCase().includes('failed') || aiAnalysis.toLowerCase().includes('tidak')) ? (
                                <div className="text-red-600 dark:text-red-400 font-semibold whitespace-pre-wrap">{aiAnalysis}</div>
                            ) : (
                                <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-headings:text-slate-100 dark:prose-strong:text-slate-100 dark:prose-p:my-1 dark:prose-h3:mt-4 dark:prose-h3:mb-2">
                                    <ReactMarkdown
                                        children={aiAnalysis}
                                        remarkPlugins={[remarkGfm]}
                                    />
                                </div>
                            )
                        )
                    ) : (
                        <div className="text-xs text-slate-400 italic">AI Performance Analyst hanya tersedia di tab <b>All</b>.</div>
                    )}
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <PerformanceChart history={activeHistory} theme={theme} />
                </div>
            </main>
        </div>
    );
};

export default Dashboard;