import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ClockIcon, InfoIcon, CalendarIcon, AlertTriangleIcon, CheckCircleIcon, XCircleIcon, SunIcon, PositionTraderIcon, EconomicCalendarIcon, RefreshIcon, PortfolioIcon } from './components/Icons';
import ImageUploader from './components/ImageUploader';
import TradeSetupCalculator from './components/TradeSetupCalculator';
import AnalysisResult from './components/AnalysisResult';
import HistoryPanel from './components/HistoryPanel';
import Sidebar from './components/Sidebar';
import ResultPopup from './components/ResultPopup';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import TopNavbar from './components/TopNavbar';
import AuthPopup from './components/AuthPopup';
import { Settings } from './components/Settings';
import EconomicCalendar from './components/EconomicCalendar';
import Portfolio from './components/Portfolio';
import CorsErrorModal from './components/CorsErrorModal';
import ConfirmationModal from './components/ConfirmationModal';
import ActiveRiskParameters from './components/ActiveRiskParameters';
import { analyzeChart, verifyApiKey } from './services/geminiService';
import * as supabaseService from './services/supabaseService';
import type { Database } from './services/supabaseService';
import { RiskParameters, TradeAnalysis, TradingMode, AppMode, TokenUsage, DashboardMode, PortfolioData, ApiStatus } from './types';
import { SupabaseClient, User } from '@supabase/supabase-js';

const modeConfigs = {
    scalp: {
        title: 'Scalp Trading',
        icon: <ClockIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />,
        subtitle: 'Get immediate trade opportunities for quick, short-term profits',
        description: "Scalp trading involves making numerous small trades on minor price changes. Trades are held for very short periods, from seconds to minutes, aiming to accumulate small profits that add up over time.",
        initialRiskParams: {
            accountBalance: '10000',
            riskPerTrade: '0.25',
            stopLoss: '6.00',
            leverage: '100',
            riskRewardRatio: '1.3',
            entryPrice: '30000'
        },
        calculator: {
            timeframeSettings: { text: 'Using 1-min scalping timeframe settings', link: '#' },
        }
    },
    swing: {
        title: 'Swing Trading',
        icon: <CalendarIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />,
        subtitle: 'Analyze charts for multi-day to multi-week trade opportunities',
        description: "Swing trading is a strategy that focuses on capturing gains in a stock (or any financial instrument) over a period of a few days to several weeks. Swing traders primarily use technical analysis to look for trading opportunities.",
        initialRiskParams: {
            accountBalance: '10000',
            riskPerTrade: '1',
            stopLoss: '13.50',
            leverage: '20',
            riskRewardRatio: '1.8',
            entryPrice: '1500'
        },
        calculator: {
            timeframeSettings: { text: 'Using 30-/60-min timeframe settings', link: '#' },
        }
    },
    day: {
        title: 'Day Trading',
        icon: <SunIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />,
        subtitle: 'Execute trades within a single trading day',
        description: "Day trading is a strategy where financial instruments are bought and sold within the same trading day. All positions are closed before the market closes, meaning no positions are held overnight.",
        initialRiskParams: {
            accountBalance: '25000',
            riskPerTrade: '0.5',
            stopLoss: '10',
            leverage: '50',
            riskRewardRatio: '1.5',
            entryPrice: '400'
        },
        calculator: {
            timeframeSettings: { text: 'Using 5/15-min timeframe settings', link: '#' },
        }
    },
    position: {
        title: 'Position Trading',
        icon: <PositionTraderIcon className="h-8 w-8 text-violet-600 dark:text-violet-400" />,
        subtitle: 'Hold trades for long-term trends, from weeks to months',
        description: "Position trading is a long-term strategy where traders hold a position for an extended period, typically months or even years. This style is less concerned with short-term market fluctuations and more with long-term trends.",
        initialRiskParams: {
            accountBalance: '50000',
            riskPerTrade: '2',
            stopLoss: '150',
            leverage: '5',
            riskRewardRatio: '3',
            entryPrice: '20000'
        },
        calculator: {
            timeframeSettings: { text: 'Using Daily/Weekly chart settings', link: '#' },
        }
    }
};

const FinancialAdviceDisclaimer: React.FC = () => (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-lg">
        <div className="flex">
            <div className="flex-shrink-0">
                <AlertTriangleIcon className="h-5 w-5 text-yellow-400 dark:text-yellow-500" />
            </div>
            <div className="ml-3">
                 <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <span className="font-bold">Important: Not Financial Advice</span><br/>
                    All analysis provided is for educational and informational purposes only. Trading involves risk. Always conduct your own research and consider consulting a financial advisor before making investment decisions.
                </p>
            </div>
        </div>
    </div>
);

const ModeExplanationBox: React.FC<{ text: string }> = ({ text }) => (
    <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
        <div className="flex">
            <div className="flex-shrink-0">
                <InfoIcon className="h-5 w-5 text-blue-400 dark:text-blue-500" />
            </div>
            <div className="ml-3">
                 <p className="text-sm text-blue-700 dark:text-blue-300">
                    {text}
                </p>
            </div>
        </div>
    </div>
);

interface TabButtonProps {
    tabName: 'setup' | 'history';
    activeTab: 'setup' | 'history';
    setActiveTab: (tab: 'setup' | 'history') => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({tabName, activeTab, setActiveTab, children}) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-6 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 focus:outline-none ${
        activeTab === tabName
          ? 'border-b-2 border-violet-600 text-violet-600 dark:border-violet-400 dark:text-violet-400'
          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
      }`}
    >
      {children}
    </button>
);


export default function App() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [activeMode, setActiveMode] = useState<AppMode>('home');
    const [dashboardSource, setDashboardSource] = useState<DashboardMode>('all');
    
    const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<Database['public']['Tables']['users']['Row'] | null>(null);
    const [showAuthPopup, setShowAuthPopup] = useState(false);

    const [geminiApiKey, setGeminiApiKey] = useState<string>('');
    const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
    const [initialCapital, setInitialCapital] = useState<number>(10000);

    const [sessionTokens, setSessionTokens] = useState(0);
    const [totalTokens, setTotalTokens] = useState(0);
    
    const [activeTab, setActiveTab] = useState<'setup' | 'history'>('setup');
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showCorsError, setShowCorsError] = useState(false);
    const [currentAnalysis, setCurrentAnalysis] = useState<TradeAnalysis | null>(null);
    
    const [allTrades, setAllTrades] = useState<TradeAnalysis[]>([]);
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);

    const [resultPopup, setResultPopup] = useState<{ analysisId: string; type: 'profit' | 'stop-loss' } | null>(null);
    const [tradeToDelete, setTradeToDelete] = useState<TradeAnalysis | null>(null);
    const [riskParams, setRiskParams] = useState<RiskParameters>(modeConfigs.scalp.initialRiskParams);

    const handleError = useCallback((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('Cross-Origin Resource Sharing')) {
            setShowCorsError(true);
            console.error(err); // Also log the full error for developers
        } else {
            setError(message);
        }
    }, []);

    const verifyAndSetKey = useCallback(async (key: string | null) => {
        if (!key) {
            setApiStatus('idle');
            setGeminiApiKey('');
            return;
        }
        setGeminiApiKey(key);
        setApiStatus('verifying');
        const isValid = await verifyApiKey(key);
        setApiStatus(isValid ? 'valid' : 'invalid');
    }, []);
    
    const { netPL } = useMemo(() => {
        const completedTrades = allTrades.filter(t => t.status !== 'pending' && t.outcomeAmount !== undefined);
        const netPLValue = completedTrades.reduce((acc, trade) => {
            if (trade.status === 'profit') {
                return acc + (trade.outcomeAmount || 0);
            }
            if (trade.status === 'stop-loss') {
                return acc - (trade.outcomeAmount || 0);
            }
            return acc;
        }, 0);
        return { netPL: netPLValue };
    }, [allTrades]);

    // `initialCapital` is the base capital from the DB.
    // `currentEquity` is the calculated live equity.
    const currentEquity = useMemo(() => initialCapital + netPL, [initialCapital, netPL]);

    // Initial setup for Supabase client and auth listener
    useEffect(() => {
        const client = supabaseService.createSupabaseClient();
        setSupabaseClient(client);

        if (client) {
            const subscription = supabaseService.onAuthStateChange(client, async (session) => {
                const sessionUser = session?.user ?? null;
                
                if (sessionUser) {
                    const profile = await supabaseService.getUserProfile(client, sessionUser.id);
                    
                    if (profile) {
                        // Profile exists, user can proceed with login.
                        setUser(sessionUser);
                        setUserProfile(profile);
                        if (profile.initial_trade) {
                            setInitialCapital(profile.initial_trade);
                        }
                        setShowAuthPopup(false);
                    } else {
                        // Profile does not exist. This is an invalid state.
                        // Log the user out and show an error message.
                        console.error(`User ${sessionUser.id} authenticated but has no profile in 'public.users'. Logging out.`);
                        handleError("Your account was authenticated, but your user profile could not be found. This can happen if the profile creation failed. Please contact support or try signing up again.");
                        await supabaseService.signOut(client);
                        // The signOut call will trigger this onAuthStateChange listener again with a null session,
                        // which will then correctly run the `else` block below to clear all local state.
                    }
                } else {
                    // User is logged out. Clear all user-specific state.
                    setUser(null);
                    setUserProfile(null);
                    setAllTrades([]);
                    setInitialCapital(10000); // Reset to default
                    setGeminiApiKey('');
                    setApiStatus('idle');
                }
            });
            return () => subscription.unsubscribe();
        }
    }, [handleError]);

    // Fetch initial data
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) setTheme(savedTheme);

        const savedTotalTokens = localStorage.getItem('totalTokens');
        if (savedTotalTokens) setTotalTokens(Number(savedTotalTokens));

        const init = async () => {
             if (!supabaseClient) {
                setError("Supabase client could not be created. Please configure credentials in services/supabaseService.ts");
                return;
            }

            try {
                 // Fetch user-specific data ONLY if a user is logged in
                if (user) {
                    const [trades, settings] = await Promise.all([
                        supabaseService.getTrades(supabaseClient, user.id),
                        supabaseService.getSettings(supabaseClient)
                    ]);
                    setAllTrades(trades);
                    if (settings?.gemini_api_key) {
                        await verifyAndSetKey(settings.gemini_api_key);
                    }
                }
                
                setError(null);
            } catch(e) {
                handleError(e);
            }
        };

        if (supabaseClient) init();
    }, [supabaseClient, user, handleError, verifyAndSetKey]);
    
    const handleApiKeyUpdate = async (newKey: string): Promise<void> => {
        if (!supabaseClient) throw new Error("Database client not available.");
        await supabaseService.updateGeminiKey(supabaseClient, newKey);
        await verifyAndSetKey(newKey);
    };

    const handleCapitalUpdate = useCallback((newCapital: number) => {
        setInitialCapital(newCapital);
    }, []);
    
    const handleProfileUpdate = useCallback((profileData: { name: string; description: string }) => {
        setUserProfile(prev => {
            if (!prev) return null;
            return {
                ...prev,
                nama: profileData.name,
                describe: profileData.description,
            };
        });
    }, []);

    const handleWithdrawal = async (amount: number) => {
        if (!supabaseClient || !user) {
            throw new Error("You must be logged in to make a withdrawal.");
        }
        const newCapital = initialCapital - amount;
        if (newCapital < 0) {
            throw new Error("Withdrawal amount exceeds available capital.");
        }
        await supabaseService.updateUserInitialCapital(supabaseClient, user.id, newCapital);
        setInitialCapital(newCapital);
    };

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => { localStorage.setItem('totalTokens', String(totalTokens)); }, [totalTokens]);

    useEffect(() => {
        setRiskParams(prevParams => ({
            ...prevParams,
            accountBalance: String(currentEquity.toFixed(2))
        }));
    }, [currentEquity]);

    const getHistoryForMode = (mode: TradingMode) => allTrades.filter(t => t.mode === mode);

    const handleModeChange = async (mode: AppMode) => {
        if (mode === activeMode) return;
        
        const protectedModes: AppMode[] = ['dashboard', 'scalp', 'swing', 'day', 'position', 'settings', 'portfolio'];
        if (protectedModes.includes(mode) && !user) {
            setShowAuthPopup(true);
            return;
        }
        
        if (mode === 'portfolio') {
            if (!portfolioData) {
                setIsPageLoading(true);
                try {
                    const data = await supabaseService.getPortfolioData(user?.id ?? '');
                    setPortfolioData(data);
                } catch (err) {
                    handleError(err);
                } finally {
                    setIsPageLoading(false);
                }
            }
        }

        if (mode !== 'dashboard' && mode !== 'home' && mode !== 'settings' && mode !== 'economic-calendar' && mode !== 'portfolio') {
            const currentTradingMode = mode as TradingMode;
            setDashboardSource(currentTradingMode);
            const newRiskParams = { ...modeConfigs[currentTradingMode].initialRiskParams };
            newRiskParams.accountBalance = String(currentEquity.toFixed(2));
            setRiskParams(newRiskParams);
            setCurrentAnalysis(null);
            setError(null);
            setActiveTab('setup');
        }
        setActiveMode(mode);
    };
    
    const updateTokenUsage = (usage: TokenUsage) => {
        setSessionTokens(prev => prev + usage.total);
        setTotalTokens(prev => prev + usage.total);
    };
    
    const handleImageSelect = useCallback(async (file: File) => {
        if (activeMode === 'dashboard' || activeMode === 'home' || activeMode === 'settings' || activeMode === 'economic-calendar' || activeMode === 'portfolio') return;
        if (!supabaseClient) {
            setError("Not connected to database. Please check settings.");
            setActiveMode('settings');
            return;
        }
        if (!user) {
            setError("You must be logged in to analyze a chart.");
            setShowAuthPopup(true);
            return;
        }
        if (apiStatus !== 'valid') {
            setError("Your Gemini API key is not valid. Please check it in Settings.");
            setActiveMode('settings');
            return;
        }
        
        const currentTradingMode = activeMode as TradingMode;
        setIsLoading(true);
        setError(null);
        try {
            const { analysis, usage } = await analyzeChart(geminiApiKey, file, riskParams, currentTradingMode);
            updateTokenUsage(usage);
            
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const newAnalysisData = {
                    ...analysis,
                    mode: currentTradingMode,
                    image: reader.result as string,
                    status: 'pending' as const,
                };
                
                const savedAnalysis = await supabaseService.addTrade(supabaseClient, newAnalysisData, user.id);
                setAllTrades(prev => [savedAnalysis, ...prev]);
                setCurrentAnalysis(savedAnalysis);
            };
        } catch (err) {
            handleError(err);
        } finally {
            setIsLoading(false);
        }
    }, [geminiApiKey, apiStatus, riskParams, activeMode, supabaseClient, user, handleError]);
    
    const handleNewAnalysis = () => {
        setCurrentAnalysis(null);
        setError(null);
    };
    
    const handleTradeResultSave = async (analysisId: string, outcome: 'profit' | 'stop-loss', amount: number) => {
        if (!supabaseClient || !user) {
            setError("Database not connected. Cannot save result.");
            return;
        }

        try {
            // Update the trade status and outcome amount in the database.
            await supabaseService.updateTradeStatus(supabaseClient, analysisId, outcome, amount, user.id);

            // Fetch ulang data trade dari Supabase agar state selalu sinkron
            const updatedTrades = await supabaseService.getTrades(supabaseClient, user.id);
            setAllTrades(updatedTrades);

            // If the currently viewed analysis is the one being updated, refresh its data in the view.
            if (currentAnalysis && currentAnalysis.id === analysisId) {
                setCurrentAnalysis(prev => prev ? { ...prev, status: outcome, outcomeAmount: amount } : null);
            }
        } catch (err) {
            handleError(err);
        }

        setResultPopup(null);
    };

    const handleSelectHistory = (analysis: TradeAnalysis) => {
        setCurrentAnalysis(analysis);
        setActiveTab('setup');
    };

    const handleRequestDelete = (trade: TradeAnalysis) => {
        setTradeToDelete(trade);
    };

    const handleConfirmDelete = async () => {
        if (!tradeToDelete || !supabaseClient || !user) {
            setError("Could not delete trade. Missing information.");
            return;
        }
        
        setIsDeleting(true);
        setError(null);
        try {
            await supabaseService.deleteTrade(supabaseClient, tradeToDelete.id, user.id);
            
            // Update local state
            setAllTrades(prev => prev.filter(t => t.id !== tradeToDelete.id));

            // If the deleted trade was the current one, clear it
            if (currentAnalysis?.id === tradeToDelete.id) {
                setCurrentAnalysis(null);
            }

        } catch(err) {
            handleError(err);
        } finally {
            setIsDeleting(false);
            setTradeToDelete(null);
        }
    };
    
    useEffect(() => {
        if(error) {
            const timer = setTimeout(() => setError(null), 10000); // Increased timeout for detailed errors
            return () => clearTimeout(timer);
        }
    }, [error]);

    const renderTradingView = (mode: TradingMode) => {
        const currentConfig = modeConfigs[mode];
        const currentHistory = getHistoryForMode(mode);
        
        return (
             <div className="flex-1 flex flex-col gap-6">
                <header>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{currentConfig.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{currentConfig.subtitle}</p>
                </header>

                {currentConfig.description && <ModeExplanationBox text={currentConfig.description} />}
                {mode === 'swing' && <FinancialAdviceDisclaimer />}

                <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                            {currentAnalysis ? (
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Analysis Details</h3>
                                        <button 
                                          onClick={handleNewAnalysis}
                                          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md shadow-sm text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                                          </svg>
                                          Back to Uploader
                                        </button>
                                    </div>
                                    <AnalysisResult analysis={currentAnalysis} riskParams={riskParams} />
                                </div>
                            ) : (
                                <>
                                  <div className="flex items-center mb-1">
                                    {currentConfig.icon}
                                    <h2 className="ml-3 text-2xl font-bold text-slate-800 dark:text-slate-100">{currentConfig.title}</h2>
                                  </div>
                                   <p className="text-slate-500 dark:text-slate-400 mb-6 ml-11">{currentConfig.subtitle}</p>
                                  <ImageUploader onImageSelect={handleImageSelect} isLoading={isLoading} />
                                </>
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-1 h-full flex flex-col bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                        {currentAnalysis && currentAnalysis.status === 'pending' && (
                          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <button
                                      onClick={() => setResultPopup({ analysisId: currentAnalysis.id, type: 'profit' })}
                                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
                                      <CheckCircleIcon className="-ml-1 mr-3 h-5 w-5" />
                                      Profit
                                  </button>
                                  <button
                                      onClick={() => setResultPopup({ analysisId: currentAnalysis.id, type: 'stop-loss' })}
                                      className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                      <XCircleIcon className="-ml-1 mr-3 h-5 w-5" />
                                      Stop Loss
                                  </button>
                              </div>
                          </div>
                        )}
                        <div className="flex border-b border-slate-200 dark:border-slate-700 px-6">
                            <TabButton tabName="setup" activeTab={activeTab} setActiveTab={setActiveTab}>Trade Setup</TabButton>
                            <TabButton tabName="history" activeTab={activeTab} setActiveTab={setActiveTab}>History</TabButton>
                        </div>
                        <div className="flex-1 min-h-0">
                          {activeTab === 'setup' ? (
                              <div className="h-full overflow-y-auto">
                                  <TradeSetupCalculator 
                                    params={riskParams} 
                                    setParams={setRiskParams}
                                    timeframeSettings={currentConfig.calculator.timeframeSettings}
                                    currentAnalysis={currentAnalysis}
                                  />
                              </div>
                          ) : (
                              <HistoryPanel
                                history={currentHistory} 
                                onSelect={handleSelectHistory}
                                onDeleteRequest={handleRequestDelete}
                                currentAnalysisId={currentAnalysis?.id}
                              />
                          )}
                        </div>
                    </div>
                </main>
            </div>
        );
    };
    
    const renderContent = () => {
        if (isPageLoading) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                     <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 animate-pulse">Loading Portfolio...</h2>
                </div>
            )
        }

        if (!supabaseClient && activeMode !== 'home') {
            return (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Database Not Connected</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400">Please check your Supabase credentials in `services/supabaseService.ts`.</p>
                </div>
            )
        }
        
        switch (activeMode) {
            case 'dashboard':
                return <Dashboard 
                        updateTokenUsage={updateTokenUsage}
                        apiKey={geminiApiKey}
                        apiStatus={apiStatus}
                        allTrades={allTrades}
                        mode={dashboardSource}
                        setDashboardSource={setDashboardSource}
                        theme={theme}
                        initialCapital={initialCapital}
                        netPL={netPL}
                        currentEquity={currentEquity}
                        user={user}
                        onLogoutClick={() => supabaseClient?.auth.signOut()}
                        onNavigate={handleModeChange}
                    />;
            case 'settings':
                return <Settings
                        initialCapital={initialCapital}
                        supabaseClient={supabaseClient}
                        user={user}
                        userProfile={userProfile}
                        geminiApiKey={geminiApiKey}
                        apiStatus={apiStatus}
                        onApiKeyUpdate={handleApiKeyUpdate}
                        onCapitalUpdate={handleCapitalUpdate}
                        onProfileUpdate={handleProfileUpdate}
                        onWithdraw={handleWithdrawal}
                    />;
             case 'economic-calendar':
                return <EconomicCalendar />;
             case 'portfolio':
                return <Portfolio 
                        apiKey={geminiApiKey}
                        apiStatus={apiStatus}
                        portfolioData={portfolioData} 
                        theme={theme}
                        updateTokenUsage={updateTokenUsage}
                        />;
            case 'scalp':
            case 'swing':
            case 'day':
            case 'position':
                return renderTradingView(activeMode);
            default:
                return null;
        }
    };
    
    if (activeMode === 'home') {
        return (
            <div className="min-h-screen flex flex-col text-slate-800 dark:text-slate-100">
                {showCorsError && <CorsErrorModal />}
                <TopNavbar 
                    onNavigate={handleModeChange} 
                    theme={theme} 
                    setTheme={setTheme} 
                    user={user}
                    onLoginClick={() => setShowAuthPopup(true)}
                    onLogoutClick={() => supabaseClient?.auth.signOut()}
                />
                <HomePage onNavigate={handleModeChange} />
                {showAuthPopup && supabaseClient && (
                    <AuthPopup
                        supabaseClient={supabaseClient}
                        onClose={() => setShowAuthPopup(false)}
                    />
                )}
            </div>
        );
    }
    
    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8">
            {showCorsError && <CorsErrorModal />}
            {resultPopup && (
                <ResultPopup
                    type={resultPopup.type}
                    onSave={(amount) => handleTradeResultSave(resultPopup.analysisId, resultPopup.type, amount)}
                    onClose={() => setResultPopup(null)}
                />
            )}
            {tradeToDelete && (
                <ConfirmationModal
                    isOpen={!!tradeToDelete}
                    onClose={() => setTradeToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    title="Delete Trade Analysis"
                    message={
                        <p>
                            Are you sure you want to delete this signal? <br/>
                            <span className="font-semibold">{tradeToDelete.tradeSetup.tradeType}</span> for <span className="font-semibold">{tradeToDelete.keyPattern}</span> from <span className="font-mono text-xs">{new Date(tradeToDelete.timestamp).toLocaleString()}</span>.
                            <br/><br/>
                            This action cannot be undone.
                        </p>
                    }
                    confirmText="Yes, Delete"
                    cancelText="No, Keep It"
                    isDestructive={true}
                    isLoading={isDeleting}
                />
            )}
            {showAuthPopup && supabaseClient && (
                    <AuthPopup
                        supabaseClient={supabaseClient}
                        onClose={() => setShowAuthPopup(false)}
                    />
            )}
            {error && (
                 <div className="fixed top-5 right-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[200] dark:bg-red-900/50 dark:text-red-200 dark:border-red-700 max-w-lg overflow-y-auto max-h-48 flex items-start gap-3" role="alert">
                    <div className="flex-1 min-w-0">
                        <strong className="font-bold">Error! </strong>
                        <span className="block sm:inline whitespace-pre-wrap">{error}</span>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="ml-4 text-2xl font-bold text-red-700 dark:text-red-200 focus:outline-none hover:text-red-900 dark:hover:text-white"
                        aria-label="Close error message"
                    >
                        ×
                    </button>
                </div>
            )}
            <div className="w-full mx-auto flex flex-col lg:flex-row gap-8">
                <Sidebar 
                    activeMode={activeMode} 
                    onModeChange={handleModeChange} 
                    theme={theme} 
                    setTheme={setTheme} 
                    apiStatus={apiStatus}
                    sessionTokens={sessionTokens}
                    totalTokens={totalTokens}
                />
                {renderContent()}
            </div>
        </div>
    );
}