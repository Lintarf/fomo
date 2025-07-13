import React, { useMemo, useState, useEffect } from 'react';
import { TradeAnalysis, TradingMode, TokenUsage, DashboardMode, ApiStatus } from '../types';
import PerformanceCard from './PerformanceCard';
import PerformanceChart from './PerformanceChart';
import TraderProfilePopup from './TraderProfilePopup';
import { CheckCircleIcon, XCircleIcon, TrendingUpIcon, TargetIcon, ClockIcon, AiIcon, ScaleIcon, CurrencyDollarIcon } from './Icons';
import { getTraderProfile } from '../utils/traderProfileHelper';
import { analyzePerformance } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CompactMetricsGrid from './CompactMetricsGrid';
import { calculateAdvancedMetrics, calculatePsychologyMetrics } from '../utils/traderProfileHelper';

interface DashboardProps {
    updateTokenUsage?: (usage: TokenUsage) => void;
    apiKey?: string;
    apiStatus?: ApiStatus;
    allTrades?: TradeAnalysis[];
    mode?: DashboardMode;
    setDashboardSource?: (mode: DashboardMode) => void;
    initialCapital?: number;
    user?: any;
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


const Dashboard: React.FC<DashboardProps> = (props) => {
    const {
        updateTokenUsage,
        apiKey,
        apiStatus,
        allTrades = [], // Default to empty array
        mode = 'all', // Default to 'all'
        setDashboardSource = () => {}, // Default to no-op
        initialCapital = 0,
        user = null
    } = props;
    console.log('Dashboard props', { allTrades, initialCapital, mode, user });
    
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
            return allTrades || [];
        }
        return (histories[mode as TradingMode] || []);
    }, [mode, allTrades, histories]);

    const traderProfile = useMemo(() => getTraderProfile(allTrades || []) || {}, [allTrades]);
    
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
        const trades = modeKey === 'all' ? (allTrades || []) : (allTrades || []).filter(t => t.mode === modeKey);
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
        const initialCap = modeKey === 'all' ? (initialCapital ?? 0) : 0;
        const currEquity = modeKey === 'all' ? (initialCapital ?? 0) + netPL : 0;
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

    // Calculate advanced and psychology metrics for all trades
    const advancedMetrics = calculateAdvancedMetrics(allTrades || []);
    const psychologyMetrics = calculatePsychologyMetrics(allTrades || []);

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
                const prompt = `You are an expert trading performance coach and psychology analyst. Here are the user's trading statistics for each mode:\n\n${summaryText}\n\n**ANALYSIS REQUIREMENTS:**\n\n- Gabungkan seluruh insight (performance, playbook, diary, psychology) dalam SATU paragraf narasi singkat, tanpa judul atau icon.\n- Setelah itu, di paragraf terpisah, tuliskan 2-3 saran actionable yang jelas dan langsung ke poin.\n\nJawab SINGKAT, maksimal 3 kalimat untuk narasi utama, dan 1 paragraf untuk saran. Jangan gunakan emoji/icon. Bahasa Indonesia yang jelas dan mudah dipahami.`;
                // --- CACHE LOGIC ---
                const statsHash = getStatsHash(statsSummary);
                const cacheKey = 'fomo-ai-analysis';
                const cacheHashKey = 'fomo-ai-hash';
                const cachedHash = localStorage.getItem(cacheHashKey);
                const cachedAnalysis = localStorage.getItem(cacheKey);
                if (cachedHash === statsHash && cachedAnalysis) {
                  setAiAnalysis(cachedAnalysis);
                  setIsAiLoading(false);
                  return;
                }
                // --- END CACHE LOGIC ---
                const { analysisText, usage } = await analyzePerformance(apiKey || '', prompt);
                updateTokenUsage(usage);
                // Ambil hanya satu jawaban (jika AI mengirim dua blok)
                const cleanAnalysis = analysisText.split(/\n(?=All:|Scalp:|Swing:|Day:|Position:)/)[0].trim();
                setAiAnalysis(cleanAnalysis);
                // Simpan ke cache
                localStorage.setItem(cacheKey, cleanAnalysis);
                localStorage.setItem(cacheHashKey, statsHash);
            } catch (error) {
                console.error("Failed to get AI analysis:", error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                let userFriendlyMessage = "Terjadi kesalahan saat mengambil analisis AI.";
                
                if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
                    userFriendlyMessage = "AI analysis tidak tersedia karena quota atau rate limit telah terlampaui. Silakan coba lagi nanti atau kurangi jumlah trade.";
                } else if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('unauthorized')) {
                    userFriendlyMessage = "API key tidak valid. Silakan periksa pengaturan API key Anda.";
                } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
                    userFriendlyMessage = "Gagal terhubung ke layanan AI. Periksa koneksi internet Anda.";
                } else if (errorMessage.toLowerCase().includes('invalid response') || errorMessage.toLowerCase().includes('format')) {
                    userFriendlyMessage = "Format respons AI tidak valid. Silakan coba lagi.";
                } else if (errorMessage.toLowerCase().includes('timeout')) {
                    userFriendlyMessage = "Request timeout. Silakan coba lagi.";
                } else {
                    userFriendlyMessage = `Error: ${errorMessage}`;
                }
                
                setAiAnalysis(userFriendlyMessage);
            } finally {
                setIsAiLoading(false);
            }
        };
        fetchAnalysis();
    }, [apiKey, apiStatus, mode, refreshTrigger, statsSummary]);
    
    const handleRefresh = () => {
      localStorage.removeItem('fomo-ai-analysis');
      localStorage.removeItem('fomo-ai-hash');
      setRefreshTrigger(t => t + 1);
    };

    let profileImageElement = null;
    if (traderProfile && typeof traderProfile.image === 'function') {
        profileImageElement = React.createElement(traderProfile.image, {
            className: 'h-10 w-10 sm:h-12 sm:w-12 text-violet-500 dark:text-violet-400'
        });
    }

    // Calculate netPL and currentEquity for the current mode/tab
    const completedTrades = activeHistory.filter(t => t.status !== 'pending');
    const netPL = completedTrades.reduce((acc, trade) => {
      if (trade.status === 'profit') return acc + (trade.outcomeAmount || 0);
      if (trade.status === 'stop-loss') return acc - (trade.outcomeAmount || 0);
      return acc;
    }, 0);
    const currentEquity = (initialCapital ?? 0) + netPL;

    return (
        <div className="flex-1 flex flex-col gap-6 pt-8 md:pt-12 px-4 md:px-8 pb-8 w-full bg-gray-50 dark:bg-slate-900 min-h-screen">
            {showProfilePopup && (
                <TraderProfilePopup
                    profile={traderProfile}
                    winRate={activeStats.winRate}
                    totalTrades={activeStats.totalCompleted}
                    onClose={() => setShowProfilePopup(false)}
                />
            )}
            <header className="flex flex-col gap-4 mb-2 sm:mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2 sm:mt-0">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                            <button
                                onClick={() => setShowProfilePopup(true)}
                                className="emblem-glow emblem-float p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:scale-110 transition"
                                title="Lihat profil trader"
                            >
                                {profileImageElement}
                            </button>
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Your Trading Performance</h1>
                            <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                                Displaying stats for <span className="font-semibold text-violet-600 dark:text-violet-400 capitalize">{mode === 'all' ? 'All' : mode}</span> trading history.
                            </p>
                        </div>
                    </div>
                    {/* Hapus icon user profile dan UserMenu dari sini */}
                </div>
                
                {/* Mode Buttons - Responsive */}
                <div className="flex flex-wrap items-center justify-center gap-2 p-1 rounded-lg">
                    <ModeButton buttonMode="all" activeMode={mode || 'all'} onClick={setDashboardSource}>All</ModeButton>
                    <ModeButton buttonMode="scalp" activeMode={mode || 'all'} onClick={setDashboardSource}>Scalp</ModeButton>
                    <ModeButton buttonMode="day" activeMode={mode || 'all'} onClick={setDashboardSource}>Day</ModeButton>
                    <ModeButton buttonMode="swing" activeMode={mode || 'all'} onClick={setDashboardSource}>Swing</ModeButton>
                    <ModeButton buttonMode="position" activeMode={mode || 'all'} onClick={setDashboardSource}>Position</ModeButton>
                </div>
            </header>

            <main className="flex flex-col gap-4 sm:gap-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    <PerformanceCard
                        label="Initial Capital"
                        value={`$${(initialCapital ?? 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
                        icon={<CurrencyDollarIcon className="w-6 h-6" />}
                        color="violet"
                    />
                    <PerformanceCard
                        label="Net P/L"
                        value={`${netPL >= 0 ? '+' : ''}${netPL.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`}
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
                    {/* Card Trader Tier dihapus */}
                </div>
                
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

                {/* Card AI Performance Analyst hanya di tab ALL */}
                {mode === 'all' && (
                  <>
                    <CompactMetricsGrid advancedMetrics={advancedMetrics} psychologyMetrics={psychologyMetrics} />
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mt-2">
                        <div className="flex items-center mb-4 gap-3">
                            <AiIcon className="h-5 w-5 sm:h-6 sm:w-6 text-violet-600 dark:text-violet-400 mr-1" />
                            <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">AI Performance Analyst</h3>
                            <button
                                onClick={handleRefresh}
                                className="ml-auto px-3 py-1.5 text-xs rounded bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                disabled={isAiLoading}
                                title="Refresh AI Analysis"
                            >
                                Refresh
                            </button>
                        </div>
                        {isAiLoading ? (
                            <AiAnalysisSkeleton />
                        ) : (
                            aiAnalysis && (aiAnalysis.toLowerCase().includes('error') || aiAnalysis.toLowerCase().includes('unavailable') || aiAnalysis.toLowerCase().includes('failed') || aiAnalysis.toLowerCase().includes('quota') || aiAnalysis.toLowerCase().includes('terjadi kesalahan')) ? (
                                <div className="space-y-3">
                                    <div className="text-red-600 dark:text-red-400 font-semibold whitespace-pre-wrap">{aiAnalysis}</div>
                                    <button
                                        onClick={handleRefresh}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                        disabled={isAiLoading}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Coba Lagi
                                    </button>
                                </div>
                            ) : (
                                <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-100 dark:prose-headings:text-slate-100 dark:prose-strong:text-slate-100 dark:prose-p:my-1 dark:prose-h3:mt-4 dark:prose-h3:mb-2">
                                    <ReactMarkdown
                                        children={String(aiAnalysis || '')}
                                        remarkPlugins={[remarkGfm]}
                                    />
                                </div>
                            )
                        )}
                    </div>
                  </>
                )}

                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <PerformanceChart history={activeHistory} />
                </div>
            </main>
        </div>
    );
};

// Fungsi hash sederhana dari summary statistik
function getStatsHash(statsSummary: any) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(statsSummary))));
}

export default Dashboard;