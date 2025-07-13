import React, { useState, useMemo } from 'react';
import { CalculatorIcon } from './Icons';
import { RiskParameters } from '../types';

interface TradeSetupCalculatorProps {
  params: RiskParameters;
  timeframeSettings: { text: string; link: string };
}

const inputClass =
  'w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200 shadow-sm placeholder-slate-400 dark:placeholder-slate-500';

const cardClass =
  'rounded-2xl shadow-xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 mb-6';

const sectionTitle =
  'text-base font-bold mb-3 tracking-wide text-slate-700 dark:text-slate-200';

const TradeSetupCalculator: React.FC<TradeSetupCalculatorProps> = ({ params, timeframeSettings }) => {
  const [margin, setMargin] = useState(params.accountBalance || '');
  const [leverage, setLeverage] = useState(params.leverage || '10');
  const [entry, setEntry] = useState(params.entryPrice || '');
  const [stopLoss, setStopLoss] = useState(params.stopLoss || '');
  const [takeProfit, setTakeProfit] = useState('');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');

  const parse = (v: string) => parseFloat(v.replace(',', '.'));

  const results = useMemo(() => {
    const m = parse(margin);
    const lvg = parse(leverage);
    const e = parse(entry);
    const sl = parse(stopLoss);
    const tp = parse(takeProfit);
    if ([m, lvg, e, sl, tp].some(isNaN) || m <= 0 || lvg <= 0 || e <= 0 || sl <= 0 || tp <= 0) {
      return {
        contract: '-',
        sl: '-',
        slMargin: '-',
        slProfit: '-',
        slProfitPct: '-',
        tp: '-',
        tpMargin: '-',
        tpProfit: '-',
        tpProfitPct: '-',
        rrr: '-',
        liq: '-',
        warning: 'Lengkapi semua input dengan benar.'
      };
    }
    // Nilai kontrak
    const contract = m * lvg;
    // SL & TP
    let slProfit = 0, tpProfit = 0, rrr = 0, liq = 0;
    if (positionType === 'LONG') {
      slProfit = (sl - e) * contract / e;
      tpProfit = (tp - e) * contract / e;
      rrr = Math.abs(tpProfit / Math.abs(slProfit));
      liq = e * (1 - 1 / lvg);
    } else {
      slProfit = (e - sl) * contract / e;
      tpProfit = (e - tp) * contract / e;
      rrr = Math.abs(tpProfit / Math.abs(slProfit));
      liq = e * (1 + 1 / lvg);
    }
    // Margin penutupan = margin awal (asumsi tidak ada perubahan margin di BingX)
    const slMargin = m;
    const tpMargin = m;
    // Persentase profit/loss terhadap margin
    const slProfitPct = `${((slProfit / m) * 100).toFixed(2)}%`;
    const tpProfitPct = `${((tpProfit / m) * 100).toFixed(2)}%`;
    let warning = '';
    if (rrr < 1) warning = 'RRR di bawah standar minimum!';
    else if (slProfit >= 0) warning = 'Stop Loss tidak valid (tidak rugi)!';
    else if (tpProfit <= 0) warning = 'Take Profit tidak valid (tidak untung)!';
    return {
      contract: `$${contract.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sl: sl,
      slMargin: `$${slMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      slProfit: `${slProfit >= 0 ? '+' : ''}$${slProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      slProfitPct,
      tp: tp,
      tpMargin: `$${tpMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tpProfit: `${tpProfit >= 0 ? '+' : ''}$${tpProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      tpProfitPct,
      rrr: rrr.toFixed(2),
      liq: liq.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 8 }),
      warning
    };
  }, [margin, leverage, entry, stopLoss, takeProfit, positionType]);

  return (
    <div className="p-4 max-w-md mx-auto font-sans">
      <div className="flex items-center mb-6">
        <CalculatorIcon className="h-7 w-7 text-violet-600 dark:text-violet-400 mr-3" />
        <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Kalkulator Leverage</h3>
      </div>
      
      {/* Timeframe Settings Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            {timeframeSettings.text}
          </span>
        </div>
      </div>
      
      <div className={cardClass}>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">Margin (USDT)</label>
            <input type="number" className={inputClass} value={margin} onChange={e => setMargin(e.target.value)} placeholder="e.g. 6.64" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">Leverage (x)</label>
            <input type="number" className={inputClass} value={leverage} onChange={e => setLeverage(e.target.value)} min={1} max={125} />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">Entry Price</label>
            <input type="number" className={inputClass} value={entry} onChange={e => setEntry(e.target.value)} placeholder="e.g. 0.621" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">Stop Loss</label>
            <input type="number" className={inputClass} value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder="e.g. 0.62552" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">Take Profit</label>
            <input type="number" className={inputClass} value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder="e.g. 0.6185" />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1 text-slate-700 dark:text-slate-200">Arah Posisi</label>
            <div className="flex gap-3 mt-1">
              <button onClick={() => setPositionType('LONG')} className={`px-4 py-2 rounded-lg font-bold shadow transition-all duration-200 border-2 ${positionType === 'LONG' ? 'bg-emerald-600 text-white border-emerald-700 scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-emerald-50 dark:hover:bg-emerald-900 hover:border-emerald-400'}`}>Long</button>
              <button onClick={() => setPositionType('SHORT')} className={`px-4 py-2 rounded-md font-bold shadow transition-all duration-200 border-2 ${positionType === 'SHORT' ? 'bg-red-600 text-white border-red-700 scale-105' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-red-50 dark:hover:bg-red-900 hover:border-red-400'}`}>Short</button>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className={cardClass}>
          <h4 className={sectionTitle}>Nilai Kontrak</h4>
          <div className="flex justify-between text-lg font-semibold">
            <span>Total Kontrak</span>
            <span>{results.contract}</span>
          </div>
        </div>
        <div className={cardClass + ' border-l-4 border-red-400'}>
          <h4 className="text-base font-bold mb-2 text-red-600 tracking-wide">Stop Loss</h4>
          <div className="flex justify-between"><span>Estimasi SL (USDT)</span><span>{results.sl}</span></div>
          <div className="flex justify-between"><span>Margin Penutupan (USDT)</span><span>{results.slMargin}</span></div>
          <div className="flex justify-between"><span>Est. Profit (USDT)</span><span>{results.slProfit}</span></div>
          <div className="flex justify-between"><span>Est. Profit (%)</span><span>{results.slProfitPct}</span></div>
        </div>
        <div className={cardClass + ' border-l-4 border-emerald-400'}>
          <h4 className="text-base font-bold mb-2 text-emerald-600 tracking-wide">Take Profit</h4>
          <div className="flex justify-between"><span>Estimasi TP (USDT)</span><span>{results.tp}</span></div>
          <div className="flex justify-between"><span>Margin Penutupan (USDT)</span><span>{results.tpMargin}</span></div>
          <div className="flex justify-between"><span>Est. Profit (USDT)</span><span>{results.tpProfit}</span></div>
          <div className="flex justify-between"><span>Est. Profit (%)</span><span>{results.tpProfitPct}</span></div>
        </div>
        <div className={cardClass}>
          <h4 className={sectionTitle}>Ringkasan</h4>
          <div className="flex justify-between"><span>Risk/Reward Ratio (RRR)</span><span>{results.rrr}</span></div>
          <div className="flex justify-between"><span>Liquidation Price (estimasi)</span><span>{results.liq}</span></div>
        </div>
        {results.warning && <div className="mt-3 text-base font-bold text-red-700 bg-red-50 dark:bg-red-900 rounded-xl p-4 border border-red-200 dark:border-red-700 shadow transition-all duration-200 animate-pulse">{results.warning}</div>}
      </div>
    </div>
  );
};

export default TradeSetupCalculator;