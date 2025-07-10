import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioData, TokenUsage, ApiStatus } from '../types';
import { InfoIcon, AiIcon, SpinnerIcon, TrendingUpIcon } from './Icons';
import { generateFinancialAdvice } from '../services/geminiService';
import PortfolioPieChart from './PortfolioPieChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PortfolioProps {
    apiKey: string;
    apiStatus: ApiStatus;
    portfolioData: PortfolioData | null;
    theme: 'light' | 'dark';
    updateTokenUsage: (usage: TokenUsage) => void;
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


const Portfolio: React.FC<PortfolioProps> = ({ apiKey, apiStatus, portfolioData, theme, updateTokenUsage }) => {
    const [aiAdvice, setAiAdvice] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [userQuery, setUserQuery] = useState('');
    const [initialAdviceLoaded, setInitialAdviceLoaded] = useState(false);

    const formatCurrency = (value: number, decimals = 2) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(value);
    };

    const fetchAiAdvice = useCallback(async (query: string) => {
        if (apiStatus !== 'valid') {
            setAiAdvice("AI analysis is unavailable. Please set a valid Gemini API key in the settings.");
            setIsAiLoading(false);
            return;
        }

        setIsAiLoading(true);
        try {
            const { analysisText, usage } = await generateFinancialAdvice(apiKey, portfolioData, query);
            setAiAdvice(analysisText);
            updateTokenUsage(usage);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setAiAdvice(`An error occurred while fetching AI analysis: ${errorMessage}`);
        } finally {
            setIsAiLoading(false);
        }
    }, [apiKey, apiStatus, portfolioData, updateTokenUsage]);

    useEffect(() => {
        if (portfolioData && !initialAdviceLoaded) {
            fetchAiAdvice("Give me a brief overview of my current portfolio allocation and one high-level principle I should keep in mind.");
            setInitialAdviceLoaded(true);
        }
    }, [portfolioData, fetchAiAdvice, initialAdviceLoaded]);

    const handleQuerySubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (userQuery.trim()) {
            fetchAiAdvice(userQuery);
        }
    };

    if (!portfolioData) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">No Portfolio Data</h2>
                <p className="mt-2 text-slate-500 dark:text-slate-400">There was an issue loading your portfolio.</p>
            </div>
        );
    }

    const { totalValue, totalPl, pl24h, pl24hPercent, assets } = portfolioData;
    const plColor = totalPl >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    const pl24hColor = pl24h >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
    const pl24hSign = pl24h >= 0 ? '+' : '';

    return (
        <div className="flex-1 flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">My Portfolio</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">An overview of your assets and performance.</p>
            </header>
            
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

            <main className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
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
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-100">{formatCurrency(asset.value)}</p>
                                            <p className={`text-xs font-semibold ${asset.totalPl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {asset.totalPl >= 0 ? '+' : ''}{formatCurrency(asset.totalPl)}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                     <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Asset Allocation</h3>
                     <PortfolioPieChart assets={assets} theme={theme} />
                </div>
            </main>

            <section className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 bg-violet-100 dark:bg-violet-900/50 p-2 rounded-full">
                        <AiIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Your AI Financial Advisor</h3>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg min-h-[120px]">
                    {isAiLoading ? <AiAnalysisSkeleton /> : (
                         <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-headings:text-slate-100 dark:prose-strong:text-slate-100 dark:prose-p:my-1 dark:prose-h3:mt-4 dark:prose-h3:mb-2">
                             <ReactMarkdown children={aiAdvice} remarkPlugins={[remarkGfm]} />
                         </div>
                    )}
                </div>

                <form onSubmit={handleQuerySubmit} className="mt-4 flex gap-3">
                    <input
                        type="text"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                        placeholder="Ask a follow-up question about your portfolio..."
                        className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                        disabled={isAiLoading}
                    />
                    <button
                        type="submit"
                        disabled={isAiLoading || !userQuery.trim() || apiStatus !== 'valid'}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isAiLoading ? <SpinnerIcon className="w-5 h-5"/> : 'Get Advice'}
                    </button>
                </form>

            </section>
        </div>
    );
};

export default Portfolio;