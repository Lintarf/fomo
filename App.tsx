import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import AuthPopup from './components/AuthPopup';
import TradingInterface from './components/TradingInterface';
import Settings from './components/Settings';
import Portfolio from './components/Portfolio';
import Community from './components/Community';
import EconomicCalendar from './components/EconomicCalendar';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import { SupabaseClient, User } from '@supabase/supabase-js';
import * as supabaseService from './services/supabaseService';
import type { Database } from './services/supabaseService';
import type { TradeAnalysis, TokenUsage, ApiStatus, DashboardMode } from './types';
import { deleteTradeAnalysis } from './services/supabaseService';

export default function App() {
    const [supabaseClient, setSupabaseClient] = useState<SupabaseClient<Database> | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [showAuthPopup, setShowAuthPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [allTrades, setAllTrades] = useState<TradeAnalysis[]>([]); // default array, typed
    const [initialCapital, setInitialCapital] = useState(0);
    const [apiKey, setApiKey] = useState<string>('');
    const [apiStatus, setApiStatus] = useState<ApiStatus>('idle');
    const [tokenUsage, setTokenUsage] = useState<TokenUsage>({ prompt: 0, completion: 0, total: 0 });
    const [dashboardMode, setDashboardMode] = useState<DashboardMode>('all');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // Handler navigasi mode
    const handleNavigate = (mode: string) => {
        if (mode === 'home') navigate('/');
        else if (mode === 'dashboard') navigate('/dashboard');
        else if (mode === 'portfolio') navigate('/portfolio');
        else if (mode === 'community') navigate('/community');
        else if (mode === 'settings') navigate('/settings');
        else if (mode === 'economic-calendar') navigate('/economic-calendar');
        else if (mode === 'trading') navigate('/trading');
    };

    useEffect(() => {
        const client = supabaseService.supabase;
        setSupabaseClient(client);
        
        if (client) {
            // Get initial session
            const getInitialSession = async () => {
                try {
                    const { data: { session } } = await client.auth.getSession();
                    setUser(session?.user ?? null);
                } catch (error) {
                    console.error('Error getting initial session:', error);
                } finally {
                    setIsLoading(false);
                }
            };
            
            getInitialSession();

            // Listen for auth changes
            const subscription = supabaseService.onAuthStateChange(client, async (session) => {
                setUser(session?.user ?? null);
                if (!session?.user) {
                    setShowAuthPopup(false);
                }
            });
            
            return () => subscription?.unsubscribe();
        }
    }, []);

    // Fetch trades & profile after login
    useEffect(() => {
        if (user && supabaseClient) {
            supabaseService.getTrades(supabaseClient, user.id).then(trades => {
                // Filter hanya trade yang valid
                const validTrades = (trades || []).filter(t =>
                    t &&
                    t.id &&
                    t.tradeSetup &&
                    t.marketTrend &&
                    t.keyPattern &&
                    t.indicatorAnalysis &&
                    t.tradeBias &&
                    typeof t.confidenceScore === 'number'
                );
                setAllTrades(validTrades);
            });
            supabaseService.getUserProfile(supabaseClient, user.id).then(profile => {
                setInitialCapital(profile?.initial_trade || 0);
            });
            // Load API key from settings
            supabaseService.getSettings(supabaseClient).then(settings => {
                if (settings?.gemini_api_key) {
                    setApiKey(settings.gemini_api_key);
                    setApiStatus('valid');
                }
            });
        } else {
            setAllTrades([]);
            setInitialCapital(0);
        }
    }, [user, supabaseClient]);

    const handleLoginClick = () => {
        setShowAuthPopup(true);
    };
    
    const handleCloseAuth = () => {
        setShowAuthPopup(false);
    };

    const updateTokenUsage = (usage: TokenUsage) => {
        setTokenUsage(usage);
    };

    const handleApiKeyUpdate = async (newApiKey: string) => {
        if (supabaseClient && user) {
            try {
                await supabaseService.updateGeminiKey(supabaseClient, newApiKey);
                setApiKey(newApiKey);
                setApiStatus('valid');
            } catch (error) {
                console.error('Error updating API key:', error);
                setApiStatus('invalid');
            }
        }
    };

    const handleDeleteTrade = async (id: string) => {
        try {
            await deleteTradeAnalysis(id); // hapus di Supabase
            setAllTrades(prev => prev.filter(trade => trade.id !== id)); // hapus di state lokal
        } catch (err: any) {
            alert('Gagal menghapus trade: ' + (err.message || err));
        }
    };

    // Calculate currentEquity for the current dashboardMode
    const completedTrades = allTrades.filter(t => dashboardMode === 'all' ? true : t.mode === dashboardMode).filter(t => t.status !== 'pending');
    const netPL = completedTrades.reduce((acc, trade) => {
        if (trade.status === 'profit') return acc + (trade.outcomeAmount || 0);
        if (trade.status === 'stop-loss') return acc - (trade.outcomeAmount || 0);
        return acc;
    }, 0);
    const currentEquity = (initialCapital ?? 0) + netPL;

    const handleLogoutClick = () => {
        supabaseService.signOut(supabaseClient);
        setUser(null);
        setApiKey('');
        setApiStatus('idle');
        setTokenUsage({ prompt: 0, completion: 0, total: 0 });
        setDashboardMode('all');
        navigate('/');
    };

    const showUserIcon = !!user;
    const activeMode = dashboardMode;

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    console.log('App user', user, 'allTrades', allTrades, 'initialCapital', initialCapital);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <TopNavbar
                onNavigate={handleNavigate}
                user={user}
                onLoginClick={handleLoginClick}
                onLogoutClick={handleLogoutClick}
                onMobileMenuToggle={() => setSidebarOpen(true)}
                showUserIcon={showUserIcon}
                activeMode={activeMode}
            />
            {user && <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
            
            <div className={user ? "lg:pl-64" : ""}>
                <Routes>
                    <Route 
                        path="/" 
                        element={
                            user ? 
                            <Navigate to="/dashboard" replace /> : 
                            <HomePage user={user} onLoginClick={handleLoginClick} />
                        } 
                    />
                    <Route 
                        path="/dashboard" 
                        element={
                            user ? 
                            <Dashboard 
                                user={user} 
                                allTrades={allTrades} 
                                initialCapital={initialCapital}
                                apiKey={apiKey}
                                apiStatus={apiStatus}
                                updateTokenUsage={updateTokenUsage}
                                mode={dashboardMode}
                                setDashboardSource={setDashboardMode}
                            /> : 
                            <Navigate to="/" replace />
                        } 
                    />
                    <Route 
                        path="/trading" 
                        element={
                            user ? 
                            <TradingInterface 
                                user={user}
                                apiKey={apiKey}
                                apiStatus={apiStatus}
                                updateTokenUsage={updateTokenUsage}
                                onTradeAdded={(trade: TradeAnalysis) => setAllTrades(prev => [trade, ...prev])}
                                onTradeDeleted={handleDeleteTrade}
                                tradeHistory={allTrades}
                                currentEquity={currentEquity}
                            /> : 
                            <Navigate to="/" replace />
                        } 
                    />
                    <Route 
                        path="/settings" 
                        element={
                            user ? 
                            <Settings 
                                user={user}
                                apiKey={apiKey}
                                apiStatus={apiStatus}
                                onApiKeyUpdate={handleApiKeyUpdate}
                            /> : 
                            <Navigate to="/" replace />
                        } 
                    />
                    <Route 
                        path="/portfolio" 
                        element={
                            user ? 
                            <Portfolio 
                                user={user}
                                apiKey={apiKey}
                                apiStatus={apiStatus}
                                updateTokenUsage={updateTokenUsage}
                                portfolioData={null}
                                userId={user.id}
                            /> : 
                            <Navigate to="/" replace />
                        } 
                    />
                    <Route 
                        path="/community" 
                        element={
                            user ? 
                            <Community 
                                user={user}
                            /> : 
                            <Navigate to="/" replace />
                        } 
                    />
                    <Route 
                        path="/economic-calendar" 
                        element={
                            user ? 
                            <EconomicCalendar /> : 
                            <Navigate to="/" replace />
                        } 
                    />
                </Routes>
            </div>
            
            {supabaseClient && (
                <AuthPopup 
                    supabaseClient={supabaseClient}
                    open={showAuthPopup} 
                    onClose={handleCloseAuth} 
                />
            )}
        </div>
    );
}