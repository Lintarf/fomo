import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioData, TokenUsage, ApiStatus } from '../types';
import { InfoIcon, AiIcon } from './Icons';
import { generateFinancialAdvice } from '../services/geminiService';
import { supabase, getPortfolioData } from '../services/supabaseService';
import PortfolioAssetManager from './PortfolioAssetManager';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User } from '@supabase/supabase-js';

interface PortfolioProps {
    user: User;
    apiKey: string;
    apiStatus: ApiStatus;
    portfolioData: PortfolioData | null;
    updateTokenUsage: (usage: TokenUsage) => void;
    userId: string;
}

const StatCard: React.FC<{ label: string; value: string; subvalue?: string; valueColor?: string }> = ({ label, value, subvalue, valueColor }) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={`text-3xl font-bold mt-2 ${valueColor || 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
        {subvalue && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{subvalue}</p>}
    </div>
);

const AiAnalysisSkeleton: React.FC = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mt-4"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6"></div>
    </div>
);

const Disclaimer: React.FC = () => (
    <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded-lg mb-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <InfoIcon className="h-5 w-5 text-blue-400 dark:text-blue-500" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-bold">Demonstration Portfolio:</span><br />
            The asset data on this page is for demonstration purposes to showcase a professional portfolio layout and AI advisor capabilities. The asset prices are randomized to simulate market changes. In a real application, this data would be connected to your live brokerage accounts.
          </p>
        </div>
      </div>
    </div>
  );


const Portfolio: React.FC<PortfolioProps> = ({ apiKey, apiStatus, portfolioData, updateTokenUsage, userId }) => {
    const [aiAdvice, setAiAdvice] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [userQuery, setUserQuery] = useState('');
    const [initialAdviceLoaded, setInitialAdviceLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPortfolioData, setCurrentPortfolioData] = useState<PortfolioData | null>(portfolioData);
    const [showAssetManager, setShowAssetManager] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const formatCurrency = (value: number, decimals = 2) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    };

    const fetchPortfolioData = useCallback(async () => {
        if (!userId) {
            setCurrentPortfolioData(null);
            setErrorMsg('Anda harus login untuk melihat portfolio.');
            return;
        }
        setIsLoading(true);
        setErrorMsg(null);
        try {
            const data = await getPortfolioData(supabase, userId);
            setCurrentPortfolioData(data);
        } catch (error: any) {
            console.error('Error fetching portfolio data:', error);
            setCurrentPortfolioData(null);
            setErrorMsg('Gagal mengambil data portfolio: ' + (error?.message || error));
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    const fetchAiAdvice = useCallback(async (query: string) => {
        if (apiStatus !== 'valid') {
            setAiAdvice("AI analysis tidak tersedia. Silakan set API key yang valid di pengaturan.");
            setIsAiLoading(false);
            return;
        }

        setIsAiLoading(true);
        try {
            const { analysisText, usage } = await generateFinancialAdvice(apiKey, currentPortfolioData, query);
            setAiAdvice(analysisText);
            updateTokenUsage(usage);
        } catch (error) {
            console.error("Failed to get AI financial advice:", error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            let userFriendlyMessage = "Terjadi kesalahan saat mengambil saran keuangan AI.";
            
            if (errorMessage.toLowerCase().includes('quota') || errorMessage.toLowerCase().includes('rate limit')) {
                userFriendlyMessage = "AI advisor tidak tersedia karena quota atau rate limit telah terlampaui. Silakan coba lagi nanti.";
            } else if (errorMessage.toLowerCase().includes('api key') || errorMessage.toLowerCase().includes('unauthorized')) {
                userFriendlyMessage = "API key tidak valid. Silakan periksa pengaturan API key Anda.";
            } else if (errorMessage.toLowerCase().includes('network') || errorMessage.toLowerCase().includes('fetch')) {
                userFriendlyMessage = "Gagal terhubung ke layanan AI. Periksa koneksi internet Anda.";
            } else if (errorMessage.toLowerCase().includes('invalid response') || errorMessage.toLowerCase().includes('format')) {
                userFriendlyMessage = "Format respons AI tidak valid. Silakan coba lagi.";
            } else if (errorMessage.toLowerCase().includes('portfolio data')) {
                userFriendlyMessage = "Data portfolio tidak tersedia. Silakan muat ulang halaman.";
            } else if (errorMessage.toLowerCase().includes('timeout')) {
                userFriendlyMessage = "Request timeout. Silakan coba lagi.";
            } else {
                userFriendlyMessage = `Error: ${errorMessage}`;
            }
            
            setAiAdvice(userFriendlyMessage);
        } finally {
            setIsAiLoading(false);
        }
    }, [apiKey, apiStatus, currentPortfolioData, updateTokenUsage]);

    useEffect(() => {
        if (!userId) {
            setCurrentPortfolioData(null);
            setErrorMsg('Anda harus login untuk melihat portfolio.');
            return;
        }
        fetchPortfolioData();
    }, [fetchPortfolioData, userId]);

    useEffect(() => {
        if (currentPortfolioData && !initialAdviceLoaded) {
            fetchAiAdvice("Give me a brief overview of my current portfolio allocation and one high-level principle I should keep in mind.");
            setInitialAdviceLoaded(true);
        }
    }, [currentPortfolioData, fetchAiAdvice, initialAdviceLoaded]);

    const handleQuerySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userQuery.trim()) {
            fetchAiAdvice(userQuery);
        }
    };

    if (!userId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Portfolio Login Required</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Anda harus login untuk mengakses fitur portfolio.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Loading portfolio data...</p>
            </div>
        );
    }

    if (!currentPortfolioData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No Portfolio Data</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">There was an issue loading your portfolio.</p>
                <button
                    onClick={fetchPortfolioData}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const { totalValue, totalPl, pl24h, pl24hPercent, assets } = currentPortfolioData;
    const plColor = totalPl >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    const pl24hColor = pl24h >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    const pl24hSign = pl24h >= 0 ? '+' : '';

    return (
        <div className="flex-1 flex flex-col gap-6 pt-8 md:pt-12 px-4 md:px-8 pb-8 w-full">
            {errorMsg && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="absolute top-1 right-2 text-xl font-bold">×</button>
                </div>
            )}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Portfolio</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">An overview of your assets and performance.</p>
                </div>
                <button
                    onClick={() => setShowAssetManager(!showAssetManager)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {showAssetManager ? 'Hide Manager' : 'Manage Assets'}
                </button>
            </header>
            
            {showAssetManager && userId && (
                <PortfolioAssetManager
                    userId={userId}
                    assets={assets}
                    onAssetAdded={fetchPortfolioData}
                    onAssetUpdated={fetchPortfolioData}
                    onAssetDeleted={fetchPortfolioData}
                />
            )}
            
            <Disclaimer />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    label="Total Portfolio Value" 
                    value={formatCurrency(totalValue)} 
                    subvalue="Across all tracked assets"
                />
                <StatCard 
                    label="Total Profit / Loss" 
                    value={formatCurrency(totalPl)}
                    valueColor={plColor}
                    subvalue={`Represents overall unrealized P/L`}
                />
                <StatCard 
                    label="24-Hour Change" 
                    value={`${pl24hSign}${formatCurrency(pl24h)}`}
                    valueColor={pl24hColor}
                    subvalue={`${pl24hSign}${pl24hPercent.toFixed(2)}%`}
                />
            </div>

            <main className="grid grid-cols-1 lg:grid-cols-5 gap-8 w-full">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Your Assets</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Asset</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Holdings</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Avg. Buy Price</th>
                                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value / P&L</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.map(asset => (
                                    <tr key={asset.symbol} className="border-b border-slate-100 dark:border-slate-700/50">
                                        <td className="px-4 py-4 flex items-center gap-3">
                                            <img src={asset.logoUrl} alt={asset.name} className="h-8 w-8"/>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{asset.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{asset.symbol}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                             <p className="font-medium text-sm text-slate-800 dark:text-slate-100">{asset.amount.toLocaleString()}</p>
                                             <p className="text-xs text-slate-500 dark:text-slate-400">{formatCurrency(asset.currentPrice, 2)}</p>
                                        </td>
                                        <td className="px-4 py-4 text-right font-mono text-sm text-slate-600 dark:text-slate-300">{formatCurrency(asset.avgBuyPrice, 2)}</td>
                                        <td className="px-4 py-4 text-right">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{formatCurrency(asset.value ?? 0)}</p>
                                            <p className={`text-xs font-semibold ${(asset.totalPl ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {(asset.totalPl ?? 0) >= 0 ? '+' : ''}{formatCurrency(asset.totalPl ?? 0)}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">AI Financial Advisor</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <AiIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ask me about my portfolio..."
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleQuerySubmit(e);
                                    }
                                }}
                                className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                            />
                            <button
                                onClick={handleQuerySubmit}
                                className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                            >
                                <AiIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>
                        {isAiLoading ? (
                            <AiAnalysisSkeleton />
                        ) : (
                            <div className="prose dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAdvice}</ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Portfolio;