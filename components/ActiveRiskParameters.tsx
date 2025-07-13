import React from 'react';
import { RiskParameters, TradeAnalysis } from '../types';
import { ScaleIcon } from './Icons';

interface ActiveRiskParametersProps {
  riskParams: RiskParameters;
  analysis: TradeAnalysis | null;
  onParamsChange?: (newParams: Partial<RiskParameters>) => void;
}

const paramColors = {
  Entry: 'bg-blue-600',
  SL: 'bg-red-600',
  TP1: 'bg-green-600',
  TP2: 'bg-emerald-400',
};
const paramShort = {
  Entry: 'Entry',
  SL: 'SL',
  TP1: 'TP1',
  TP2: 'TP2',
};

// Helper: anti-overlap zig-zag label
function getZigzagOffsets(positions: number[]) {
  // Jika dua/tiga marker sangat dekat, zig-zag: [0, -28, +28, -56, +56]
  const sorted = [...positions].sort((a, b) => a - b);
  const offsets = positions.map(() => 0);
  for (let i = 0; i < positions.length - 1; i++) {
    if (Math.abs(sorted[i] - sorted[i + 1]) < 7) {
      offsets[positions.indexOf(sorted[i])] = -28;
      offsets[positions.indexOf(sorted[i + 1])] = 28;
      if (positions.length > 2 && i + 2 < positions.length && Math.abs(sorted[i + 1] - sorted[i + 2]) < 7) {
        offsets[positions.indexOf(sorted[i + 2])] = -56;
      }
    }
  }
  return offsets;
}

// Fungsi smart spacing: membagi bar menjadi slot dengan jarak minimum antar marker
function getSmartPositions(prices: number[], minGapPercent = 18): number[] {
  // Urutkan harga dan simpan mapping ke index aslinya
  const indexed = prices.map((price, idx) => ({ price, idx }));
  indexed.sort((a, b) => a.price - b.price);

  // Bagi bar menjadi slot dengan jarak minimum
  const n = prices.length;
  const minTotal = minGapPercent * (n - 1);
  const free = 100 - minTotal;
  const slot = n > 1 ? free / (n - 1) : 0;

  // Hitung posisi slot
  let positions: number[] = [];
  for (let i = 0; i < n; i++) {
    positions.push(i * (minGapPercent + slot));
  }

  // Kembalikan ke urutan aslinya
  const result: number[] = [];
  indexed.forEach((item, i) => {
    result[item.idx] = positions[i];
  });
  return result;
}

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

const Marker: React.FC<{ color: string; left: string; label: string; yOffset: number; value: string }> = ({ color, left, label, yOffset, value }) => {
  // Jika marker SL dan left sangat kecil, tambahkan offset ekstra agar tidak hilang di mobile
  let adjustedLeft = left;
  if (label === 'SL' && (left === '0%' || left === '0' || left === 'calc(0% - 24px)' || left === 'calc(0% - 0px)')) {
    adjustedLeft = '1.5rem';
  }
  // Jika marker TP1 dan left sangat besar, tambahkan offset ekstra ke kiri agar tidak hilang di kanan
  if (label === 'TP1' && (left === '100%' || left === 'calc(100% - 24px)' || left === 'calc(100% - 0px)')) {
    adjustedLeft = 'calc(100% - 1.5rem)';
  }
  return (
    <div className="absolute flex flex-col items-center transition-all duration-500 animate-fadein" style={{ left: adjustedLeft, top: 0, zIndex: 10 }}>
      <div style={{ transform: `translateY(${yOffset}px)` }} className="transition-all duration-500">
        <span className={`px-2 py-0.5 rounded-md font-bold text-xs text-white shadow-md ${color} animate-fadein`}>{label}</span>
      </div>
      <div className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${color} mt-1 animate-markerpop`}></div>
      <span className="mt-1 text-xs font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap">
        {Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 })}
      </span>
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
  // Untuk smart spacing hanya 3 marker
  const prices = [stopLossPrice, entryPrice, tp1Price];
  const smartPositions = getSmartPositions(prices, 24); // 24% min gap antar marker (lebih lebar karena hanya 3)
  const getLeftSmart = (idx: number) => `calc(${smartPositions[idx]}% - 24px)`;
  // Zig-zag label offset tetap dipakai
  const zigzagOffsets = getZigzagOffsets(smartPositions);

  // Arrow animasi dari Entry ke TP1
  const entryIdx = 1;
  const tp1Idx = 2;
  const arrowLeft = Math.min(smartPositions[entryIdx], smartPositions[tp1Idx]);
  const arrowWidth = Math.abs(smartPositions[tp1Idx] - smartPositions[entryIdx]);
  const arrowDirection = isLong ? 'right' : 'left';

  // Robust riskPerTrade: parse number, fallback to 1.0 if missing/invalid
  let riskPercent: number = 1.0;
  if (typeof analysis.riskPerTrade === 'number' && !isNaN(analysis.riskPerTrade)) {
    riskPercent = analysis.riskPerTrade;
  } else if (typeof analysis.riskPerTrade === 'string') {
    const parsed = parseFloat(String(analysis.riskPerTrade).replace(/[^\d.\-]/g, ''));
    if (!isNaN(parsed)) riskPercent = parsed;
  }

  // Use only riskParams.currentEquity for equity value
  const equity = riskParams.currentEquity !== undefined && riskParams.currentEquity !== null ? Number(riskParams.currentEquity) : undefined;

  if (equity === undefined || equity === null) {
    console.warn('ActiveRiskParameters: equity is undefined or null, cannot display Risk $ and Equity');
  }

  return (
    <div className="bg-white dark:bg-slate-800 p-3 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3 sm:mb-4">
        <ScaleIcon className="w-5 h-5 text-violet-500" />
        Active Risk Parameters
      </h3>
      {/* Bar besar dengan marker */}
      <div className="relative w-full overflow-x-auto sm:overflow-visible px-1 scrollbar-thin scrollbar-thumb-violet-300 sm:scrollbar-none">
        <div className="min-w-[350px] sm:min-w-0 h-20 flex items-end mb-4 sm:mb-6 pl-6 pr-2">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-5 rounded-full animate-gradient-move bg-gradient-to-r from-red-200 via-slate-100 to-emerald-200 dark:from-red-400/30 dark:to-emerald-400/30 shadow-lg"></div>
          {/* Arrow animasi dari Entry ke TP1, DI DALAM bar */}
          <div
            className="absolute flex items-center pointer-events-none"
            style={{
              left: `calc(${arrowLeft}% + 8px)`,
              width: `calc(${arrowWidth}% - 16px)`,
              top: '50%',
              height: '20px',
              zIndex: 8,
              transform: 'translateY(-50%)',
            }}
          >
            <div
              className="w-full h-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 rounded-full relative animate-pulse-futuristic"
              style={{
                boxShadow: '0 0 8px 2px #0ff8, 0 0 16px 4px #0ff4',
                opacity: 0.7,
              }}
            >
              {/* Arrowhead benar-benar bergerak */}
              {arrowDirection === 'right' ? (
                <span
                  className="absolute right-0 -top-2 text-xl sm:text-2xl animate-arrow-move-horizontal"
                  style={{ color: '#22d3ee', filter: 'drop-shadow(0 0 6px #22d3ee)' }}
                >
                  ▶
                </span>
              ) : (
                <span
                  className="absolute left-0 -top-2 text-xl sm:text-2xl animate-arrow-move-horizontal"
                  style={{ color: '#f87171', filter: 'drop-shadow(0 0 6px #f87171)' }}
                >
                  ◀
                </span>
              )}
            </div>
          </div>
          {/* Marker hanya untuk SL, Entry, TP1 */}
          <Marker color={paramColors.SL} left={getLeftSmart(0)} label={paramShort.SL} yOffset={zigzagOffsets[0]} value={String(stopLossPrice)} />
          <Marker color={paramColors.Entry} left={getLeftSmart(1)} label={paramShort.Entry} yOffset={zigzagOffsets[1]} value={String(entryPrice)} />
          <Marker color={paramColors.TP1} left={getLeftSmart(2)} label={paramShort.TP1} yOffset={zigzagOffsets[2]} value={String(tp1Price)} />
        </div>
      </div>
      {/* Info: clarify marker positions */}
      <div className="text-xs text-slate-400 dark:text-slate-500 text-center mb-2">
        Marker posisi pada bar ini menggunakan smart spacing agar tidak overlap, bukan proporsional harga. Angka di bawah marker adalah harga asli.
      </div>
      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4 mt-4 sm:mt-6">
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Risk %</p>
          <p className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">{riskPercent + '%'}</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Risk $</p>
          {(() => {
            const eqNum = Number(equity ?? 0);
            const riskNum = Number(riskPercent ?? 0);
            const riskDollar = eqNum * riskNum / 100;
            const riskDollarStr = '$' + riskDollar.toLocaleString('en-US', {minimumFractionDigits: 4, maximumFractionDigits: 4});
            return <p className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">{riskDollarStr}</p>;
          })()}
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">R:R Ratio (TP1)</p>
          <p className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">{riskParams.riskRewardRatio}:1</p>
        </div>
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Equity</p>
          {(() => {
            const eqNum = Number(equity ?? 0);
            const eqStr = '$' + eqNum.toLocaleString('en-US', {maximumFractionDigits: 0});
            return <p className="font-bold text-base sm:text-lg text-slate-800 dark:text-slate-100">{eqStr}</p>;
          })()}
        </div>
        {/* Potensi Profit (USD) as fifth column */}
        <div className="text-center">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Potensi Profit (USD)</p>
          {(() => {
            let leverage = Number(analysis?.leverage);
            if (!leverage || isNaN(leverage)) {
              leverage = Number(riskParams.leverage);
            }
            const entry = Number(analysis?.tradeSetup?.entryPrice);
            const tp = Number(analysis?.tradeSetup?.takeProfit);
            const eqNum = Number(equity ?? 0);
            const tradeType = analysis?.tradeSetup?.tradeType;
            const canCalculate = entry && tp && leverage && eqNum && tradeType;
            let profitStr: string | React.ReactNode = <span className="text-slate-400">-</span>;
            if (canCalculate) {
              const calculatedProfit = Number(calculateProfitAmount(entry, tp, leverage, eqNum, tradeType));
              const formattedProfit = String(calculatedProfit.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}));
              profitStr = '$' + formattedProfit;
            }
            return <p className="font-bold text-base sm:text-lg text-emerald-800 dark:text-emerald-200">{profitStr}</p>;
          })()}
        </div>
      </div>
      {/* Marker values below */}
      {/* Angka di bawah marker dihapus sesuai permintaan user */}
    </div>
  );
};

export default ActiveRiskParameters;


