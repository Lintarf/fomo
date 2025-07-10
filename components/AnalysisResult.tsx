import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TradeAnalysis, RiskParameters } from '../types';
import { CheckCircleIcon, XCircleIcon, ChatBubbleIcon } from './Icons';
import ActiveRiskParameters from './ActiveRiskParameters';

interface AnalysisResultProps {
  analysis: TradeAnalysis;
  riskParams: RiskParameters;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 ${className}`}>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 ${className}`}>{value}</p>
  </div>
);

const TradeSetupCard: React.FC<{ analysis: TradeAnalysis }> = ({ analysis }) => {
  const { tradeType, entryPrice, stopLoss, takeProfit } = analysis.tradeSetup;
  const isLong = tradeType === 'Long';

  return (
    <div className={`p-4 rounded-lg border-l-4 ${isLong ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/50 dark:border-emerald-700' : 'bg-red-50 border-red-500 dark:bg-red-900/50 dark:border-red-700'}`}>
      <h4 className={`text-lg font-bold ${isLong ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
        Suggested Trade: {tradeType}
      </h4>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Entry Price</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{entryPrice}</p>
        </div>
        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Stop Loss</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{stopLoss}</p>
        </div>
        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Take Profit</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{takeProfit}</p>
        </div>
      </div>
    </div>
  );
};


const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, riskParams }) => {
  return (
    <div className="w-full h-full flex flex-col gap-6">
        <div className="w-full">
            <img src={analysis.image} alt="Analyzed chart" className="w-full h-auto object-contain rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" />
        </div>
        <div className="w-full space-y-4">
            {analysis.status !== 'pending' && (
              <div className={`p-3 rounded-lg font-bold text-lg text-center flex items-center justify-center gap-2 ${analysis.status === 'profit' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                {analysis.status === 'profit' ? <CheckCircleIcon className="h-6 w-6"/> : <XCircleIcon className="h-6 w-6"/>}
                <span>TRADE COMPLETED: <span className="uppercase">{analysis.status.replace('-', ' ')}</span></span>
              </div>
            )}

            <TradeSetupCard analysis={analysis} />
            
            <ActiveRiskParameters riskParams={riskParams} analysis={analysis} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard label="Market Trend" value={analysis.marketTrend} />
                <StatCard label="Trade Bias" value={analysis.tradeBias} className={analysis.tradeBias === 'Bullish' ? 'text-emerald-600 dark:text-emerald-400' : analysis.tradeBias === 'Bearish' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'} />
                <StatCard label="Confidence" value={`${analysis.confidenceScore}%`} />
                {analysis.status !== 'pending' && analysis.outcomeAmount !== undefined && (
                   <StatCard 
                     label={analysis.status === 'profit' ? 'Profit Amount' : 'Loss Amount'}
                     value={`$${analysis.outcomeAmount.toLocaleString()}`}
                     className={analysis.status === 'profit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                   />
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                    <ChatBubbleIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">Trade Reasoning</h4>
                </div>
                <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-strong:text-slate-200 dark:prose-ul:pl-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {analysis.rationale}
                    </ReactMarkdown>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Key Pattern</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{analysis.keyPattern}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Indicator Analysis</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{analysis.indicatorAnalysis}</p>
            </div>
        </div>
    </div>
  );
};

export default AnalysisResult;