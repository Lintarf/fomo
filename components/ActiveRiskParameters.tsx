import React from 'react';
import { RiskParameters, TradeAnalysis } from '../types';
import { ScaleIcon } from './Icons';

interface ActiveRiskParametersProps {
  riskParams: RiskParameters;
  analysis: TradeAnalysis | null;
}

const TimelinePoint: React.FC<{ name: string; price: string; color: 'red' | 'green' | 'blue' }> = ({ name, price, color }) => {
    const colorClasses = {
        red: 'bg-red-600',
        green: 'bg-green-600',
        blue: 'bg-blue-600'
    };
    
    return (
        <div className="flex flex-col items-center">
            <div className={`px-2 py-0.5 text-xs font-bold text-white ${colorClasses[color]} rounded-md`}>
                {name}
            </div>
            <div className={`w-0.5 h-4 ${colorClasses[color]}`}></div>
            <div className={`w-3 h-3 ${colorClasses[color]} rounded-full border-2 border-white dark:border-slate-800`}></div>
            <p className="absolute -bottom-5 text-xs font-mono text-slate-600 dark:text-slate-300">{price}</p>
        </div>
    );
};

const ActiveRiskParameters: React.FC<ActiveRiskParametersProps> = ({ riskParams, analysis }) => {
  if (!analysis) return null;

  const { tradeSetup } = analysis;
  const isLong = tradeSetup.tradeType === 'Long';

  const entryPrice = parseFloat(tradeSetup.entryPrice);
  const stopLossPrice = parseFloat(tradeSetup.stopLoss);
  const tp1Price = parseFloat(tradeSetup.takeProfit);
  
  if (isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(tp1Price)) return null;

  const stopLossPoints = Math.abs(entryPrice - stopLossPrice);
  
  // Create a plausible TP2 price for visual representation, e.g., 2R or a bit more
  const rr1 = parseFloat(riskParams.riskRewardRatio) || 1.5;
  const tp2Points = stopLossPoints * (rr1 * 1.5);
  const tp2Price = isLong ? entryPrice + tp2Points : entryPrice - tp2Points;

  const prices = [stopLossPrice, entryPrice, tp1Price, tp2Price];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const totalSpan = maxPrice - minPrice;

  let positions = { stop: 50, entry: 50, tp1: 50, tp2: 50 };
  if (totalSpan > 0) {
      positions = {
          stop: ((stopLossPrice - minPrice) / totalSpan) * 100,
          entry: ((entryPrice - minPrice) / totalSpan) * 100,
          tp1: ((tp1Price - minPrice) / totalSpan) * 100,
          tp2: ((tp2Price - minPrice) / totalSpan) * 100,
      };
  }

  const arrowPosition = isLong
    ? `calc(${positions.entry}% + 25px)`
    : `calc(${positions.entry}% - 45px)`;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
        <ScaleIcon className="w-5 h-5 text-violet-500" />
        Active Risk Parameters
      </h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Risk %</p>
          <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{riskParams.riskPerTrade}%</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">R:R Ratio (TP1)</p>
          <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{riskParams.riskRewardRatio}:1</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">Entry</p>
          <p className="font-bold text-lg text-slate-800 dark:text-slate-100">{tradeSetup.entryPrice}</p>
        </div>
      </div>
      
      <div className="relative w-full h-16 flex items-center">
        {/* Background Gradient */}
        <div className={`absolute inset-y-0 left-0 right-0 rounded-full opacity-30 ${isLong ? 'bg-gradient-to-r from-red-400/80 to-emerald-400/80' : 'bg-gradient-to-r from-emerald-400/80 to-red-400/80'}`}></div>
        
        {/* Central line */}
        <div className="w-full h-0.5 bg-slate-300 dark:bg-slate-600"></div>

        {/* Timeline points container with padding */}
        <div className="absolute w-[calc(100%-2rem)] h-full top-0 left-1/2 -translate-x-1/2 flex items-center">
            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${positions.stop}%`, transform: 'translateX(-50%)' }}>
                <TimelinePoint name="SL" price={stopLossPrice.toFixed(Math.max(2, (stopLossPrice.toString().split('.')[1] || []).length))} color="red" />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${positions.entry}%`, transform: 'translateX(-50%)' }}>
                <TimelinePoint name="Entry" price={entryPrice.toFixed(Math.max(2, (entryPrice.toString().split('.')[1] || []).length))} color="blue" />
            </div>
             <div className="absolute top-1/2 -translate-y-1/2" style={{ left: arrowPosition, transform: 'translateX(-50%)' }}>
                {isLong ? (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                ) : (
                    <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                )}
            </div>
            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${positions.tp1}%`, transform: 'translateX(-50%)' }}>
                <TimelinePoint name="TP1" price={tp1Price.toFixed(Math.max(2, (tp1Price.toString().split('.')[1] || []).length))} color="green" />
            </div>
            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${positions.tp2}%`, transform: 'translateX(-50%)' }}>
                <TimelinePoint name="TP2" price={tp2Price.toFixed(Math.max(2, (tp2Price.toString().split('.')[1] || []).length))} color="green" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveRiskParameters;