import React from 'react';
import { TradeAnalysis } from '../types';
import { HistoryIcon, TrashIcon } from './Icons';

interface HistoryPanelProps {
  history: TradeAnalysis[];
  onSelect: (analysis: TradeAnalysis) => void;
  onDeleteRequest: (analysis: TradeAnalysis) => void;
  currentAnalysisId?: string;
}

const StatusBadge: React.FC<{ status: TradeAnalysis['status'] }> = ({ status }) => {
    if (status === 'pending') return null;

    const baseClasses = 'text-xs font-bold px-2 py-0.5 rounded-full';
    if (status === 'profit') {
        return <span className={`${baseClasses} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300`}>PROFIT</span>;
    }
    if (status === 'stop-loss') {
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300`}>LOSS</span>;
    }
    return null;
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onDeleteRequest, currentAnalysisId }) => {
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center mb-4 flex-shrink-0">
        <HistoryIcon className="h-6 w-6 text-slate-500 dark:text-slate-400 mr-3" />
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analysis History</h3>
      </div>
      {history.length === 0 ? (
        <div className="text-center py-10 flex-1">
          <p className="text-slate-500 dark:text-slate-400">No analyses yet.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Upload a chart to get started.</p>
        </div>
      ) : (
        <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
          {history.map((item) => (
            <li key={item.id} className="group">
              <div
                className={`w-full flex items-center justify-between p-3 rounded-md transition-colors duration-150 ${
                  currentAnalysisId === item.id 
                    ? 'bg-violet-100 ring-2 ring-violet-500 dark:bg-violet-900/50 dark:ring-violet-400' 
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700/50 dark:hover:bg-slate-700'
                }`}
              >
                <button
                    onClick={() => onSelect(item)}
                    className="flex-grow text-left min-w-0"
                    aria-label={`Select analysis from ${new Date(item.timestamp).toLocaleString()}`}
                >
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <p className={`font-semibold text-sm truncate ${item.tradeSetup.tradeType === 'Long' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                                {item.tradeSetup.tradeType} ({item.tradeBias})
                            </p>
                            <StatusBadge status={item.status} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 truncate">
                      Pattern: {item.keyPattern}
                    </p>
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRequest(item);
                    }}
                    className="ml-2 p-1 rounded-full text-slate-400 dark:text-slate-500 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete analysis"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default HistoryPanel;