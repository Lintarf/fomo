import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TradeAnalysis, RiskParameters } from '../types';
import { CheckCircleIcon, XCircleIcon, ChatBubbleIcon } from './Icons';
import ActiveRiskParameters from './ActiveRiskParameters';

interface AnalysisResultProps {
  analysis: TradeAnalysis;
  riskParams: RiskParameters;
  onBackToUploader?: () => void;
}

const StatCard: React.FC<{ label: string; value: React.ReactNode; className?: string }> = ({ label, value, className = '' }) => (
  <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center ${className}`}>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    <p className={`mt-1 text-base font-semibold text-slate-900 dark:text-slate-100 ${className}`}>{value}</p>
  </div>
);

const TradeSetupCard: React.FC<{ analysis: TradeAnalysis }> = ({ analysis }) => {
  const { tradeType, entryPrice, stopLoss, takeProfit } = analysis.tradeSetup;
  const isLong = tradeType === 'Long';

  // Validasi profesional: semua angka harus valid, tidak 0, tidak N/A, dan logis
  const isValidNumber = (val: any) => val !== undefined && val !== null && val !== '' && val !== 'N/A' && !isNaN(Number(val)) && Number(val) !== 0;
  const validEntry = isValidNumber(entryPrice);
  const validSL = isValidNumber(stopLoss);
  const validTP = isValidNumber(takeProfit);
  // Validasi logika: Long (SL < Entry < TP), Short (TP < Entry < SL)
  let isLogicValid = false;
  if (isLong) isLogicValid = Number(stopLoss) < Number(entryPrice) && Number(entryPrice) < Number(takeProfit);
  else isLogicValid = Number(takeProfit) < Number(entryPrice) && Number(entryPrice) < Number(stopLoss);
  const isAllValid = validEntry && validSL && validTP && isLogicValid;

  if (!isAllValid) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border-l-4 border-red-500 dark:bg-red-900/50 dark:border-red-700 text-red-700 dark:text-red-300 font-bold text-center">
        AI gagal memberikan sinyal profesional. Silakan ulangi analisa.
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-l-4 ${isLong ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/50 dark:border-emerald-700' : 'bg-red-50 border-red-500 dark:bg-red-900/50 dark:border-red-700'}`}>
      <h4 className={`text-lg font-bold ${isLong ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'} text-center`}>
        Suggested Trade: {tradeType}
      </h4>
      {/* Warning jika confidence rendah */}
      {Number(analysis.confidenceScore) < 70 && (
        <div className="mt-2 p-2 rounded bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 font-semibold text-sm text-center">
          AI tidak yakin, sinyal lemah. Gunakan dengan kehati-hatian.
        </div>
      )}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm justify-items-center text-center">
        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Entry Price</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{Number(entryPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</p>
        </div>
        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Stop Loss</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{Number(stopLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</p>
        </div>
        <div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Take Profit</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{Number(takeProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</p>
        </div>
      </div>
    </div>
  );
};

// Helper function to calculate profit amount using BingX formula
function calculateProfitAmount(entry: number, tp: number, leverage: number, equity: number, tradeType: string) {
  if (!entry || !tp || !leverage || !equity) return 0;
  const positionSize = equity * leverage;
  if (tradeType === 'Long') {
    return ((tp - entry) * (positionSize / entry));
  } else {
    return ((entry - tp) * (positionSize / entry));
  }
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, riskParams, onBackToUploader }) => {
  // Add safety checks for analysis data
  if (!analysis) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 dark:text-slate-400">No analysis data available</p>
        </div>
      </div>
    );
  }

  // Show user-friendly error if error is present in analysis
  if (analysis.error) {
    let userMessage = analysis.error;
    if (analysis.error.toLowerCase().includes('timeframe')) {
      userMessage = 'Anda mengupload chart dengan timeframe yang tidak sesuai mode trading.\nSilakan pilih mode yang sesuai dengan timeframe chart Anda.';
    }
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-500 dark:text-red-400 font-semibold whitespace-pre-line">{userMessage}</p>
          </div>
          {onBackToUploader && (
            <button
              onClick={onBackToUploader}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-700 mt-4"
            >
              Kembali ke Upload
            </button>
          )}
        </div>
      </div>
    );
  }

  // Check if required fields exist
  const hasValidAnalysis = analysis.tradeSetup && analysis.marketTrend && analysis.tradeBias;

  if (!hasValidAnalysis) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-red-500 dark:text-red-400 font-semibold">Invalid analysis data</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">The analysis result is incomplete or corrupted.</p>
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            <p>This might be due to:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>AI response format error</li>
              <li>Network connectivity issues</li>
              <li>API quota exceeded</li>
              <li>Image processing error</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            {onBackToUploader && (
              <button
                onClick={onBackToUploader}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-violet-600 text-white hover:bg-violet-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
                Back to Uploader
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-slate-600 text-white hover:bg-slate-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col gap-6">
        <div className="w-full">
            {analysis.image && analysis.image.trim() !== '' ? (
                <img 
                    src={analysis.image} 
                    alt="Analyzed chart" 
                    className="w-full h-auto object-contain rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    onError={(e) => {
                        console.error("Failed to load analysis image:", analysis.image?.substring(0, 50) + "...");
                        e.currentTarget.style.display = 'none';
                        // Show fallback when image fails to load
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center';
                        fallbackDiv.innerHTML = '<p class="text-slate-500 dark:text-slate-400">Image failed to load</p>';
                        e.currentTarget.parentNode?.appendChild(fallbackDiv);
                    }}
                    onLoad={() => {
                        console.log("Analysis image loaded successfully");
                    }}
                />
            ) : (
                <div className="w-full h-48 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-slate-500 dark:text-slate-400">No image available</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Image data: {analysis.image ? 'Present but empty' : 'Missing'}
                        </p>
                    </div>
                </div>
            )}
        </div>
        <div className="w-full space-y-4">
            {analysis.status !== 'pending' && (
              <div className={`p-3 rounded-lg font-bold text-lg text-center flex items-center justify-center gap-2 ${analysis.status === 'profit' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                {analysis.status === 'profit' ? <CheckCircleIcon className="h-6 w-6"/> : <XCircleIcon className="h-6 w-6"/>}
                <span>TRADE COMPLETED: <span className="uppercase">{analysis.status.replace('-', ' ')}</span></span>
              </div>
            )}

            <TradeSetupCard analysis={analysis} />
            
            {/* REMOVE the info grid above Active Risk Parameters. Only show Potensi Profit (USD) below trade setup. */}
            {/* Potensi Profit (USD) card di bawah ini DIHAPUS agar tidak tampil dua kali */}
            
            <ActiveRiskParameters riskParams={riskParams} analysis={analysis} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 justify-items-center text-center">
                <StatCard label="Market Trend" value={analysis.marketTrend || 'N/A'} />
                <StatCard 
                  label="Trade Bias" 
                  value={analysis.tradeBias || 'N/A'} 
                  className={analysis.tradeBias === 'Bullish' ? 'text-emerald-600 dark:text-emerald-400' : analysis.tradeBias === 'Bearish' ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'} 
                />
                <StatCard label="Confidence" value={`${analysis.confidenceScore || 0}%`} />
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
                    {Array.isArray(analysis.rationale) ? (
                      <ul className="list-disc pl-5">
                        {analysis.rationale.map((item: string, idx: number) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      (() => {
                        // Jika rationale string tapi stringified array, parse ke array
                        let parsed: any = analysis.rationale;
                        try {
                          if (typeof analysis.rationale === 'string' && analysis.rationale.trim().startsWith('[')) {
                            parsed = JSON.parse(analysis.rationale);
                          }
                        } catch {}
                        if (Array.isArray(parsed)) {
                          return (
                            <ul className="list-disc pl-5">
                              {parsed.map((item: string, idx: number) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          );
                        }
                        // Fallback: render as markdown/text
                        return (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {analysis.rationale || 'No reasoning available'}
                          </ReactMarkdown>
                        );
                      })()
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Key Pattern</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{analysis.keyPattern || 'No pattern identified'}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">Indicator Analysis</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{analysis.indicatorAnalysis || 'No indicator analysis available'}</p>
            </div>
        </div>
    </div>
  );
};

export default AnalysisResult;