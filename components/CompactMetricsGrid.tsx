import React from 'react';
import { AdvancedMetrics, PsychologyMetrics } from '../types';
import { getMoodEmoji, getStressColor } from '../utils/traderProfileHelper';

interface CompactMetricsGridProps {
  advancedMetrics: AdvancedMetrics;
  psychologyMetrics: PsychologyMetrics;
}

const CompactMetricsGrid: React.FC<CompactMetricsGridProps> = ({ advancedMetrics, psychologyMetrics }) => {
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Performance Card */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="font-bold mb-2 text-slate-700 dark:text-slate-200">Performance</h4>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🏆</span>
          <span className="text-sm text-slate-500 mr-1">Win Rate:</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">{formatPercentage(advancedMetrics.winRate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <span className="text-sm text-slate-500 mr-1">Profit Factor:</span>
          <span className="font-bold text-violet-600 dark:text-violet-400">{formatNumber(advancedMetrics.profitFactor)}</span>
        </div>
      </div>
      {/* Psychology Card */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="font-bold mb-2 text-slate-700 dark:text-slate-200">Psychology</h4>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">{getMoodEmoji(psychologyMetrics.currentMood)}</span>
          <span className="text-sm text-slate-500 mr-1">Mood:</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 capitalize">{psychologyMetrics.currentMood}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span className="text-sm text-slate-500 mr-1">Stress:</span>
          <span className={`font-bold ${getStressColor(psychologyMetrics.stressLevel)}`}>{psychologyMetrics.stressLevel}/10</span>
        </div>
      </div>
    </div>
  );
};

export default CompactMetricsGrid; 