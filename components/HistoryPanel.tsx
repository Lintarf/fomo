import React, { useState } from 'react';
import { TradeAnalysis } from '../types';
import { HistoryIcon, TrashIcon, CommunityIcon } from './Icons';
import { supabase } from '../services/supabaseService';
import { checkIfAnalysisShared } from '../services/supabaseService';
import { updateTradeStatus } from '../services/supabaseService';

interface HistoryPanelProps {
  history: TradeAnalysis[];
  onSelect: (analysis: TradeAnalysis) => void;
  onDeleteRequest: (analysis: TradeAnalysis) => void;
  onShareRequest?: (analysis: TradeAnalysis) => void;
  currentAnalysisId?: string;
  userId?: string; // Add userId prop
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
  
};

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onDeleteRequest, onShareRequest, currentAnalysisId, userId }) => {
  const [sharedAnalyses, setSharedAnalyses] = React.useState<Set<string>>(new Set());
  const [loadingShares, setLoadingShares] = React.useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [modalTrade, setModalTrade] = useState<TradeAnalysis | null>(null);
  const [modalStatus, setModalStatus] = useState<'profit' | 'stop-loss' | null>(null);
  const [outcomeAmount, setOutcomeAmount] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load shared analyses status
  React.useEffect(() => {
    const loadSharedStatus = async () => {
      if (!history.length || !userId) return;
      
      setLoadingShares(true);
      try {
        const sharedPromises = history.map(analysis => 
          checkIfAnalysisShared(supabase, userId, analysis.id)
        );
        const sharedResults = await Promise.all(sharedPromises);
        const sharedSet = new Set<string>();
        history.forEach((analysis, index) => {
          if (sharedResults[index]) {
            sharedSet.add(analysis.id);
          }
        });
        setSharedAnalyses(sharedSet);
      } catch (error) {
        console.error('Error loading shared status:', error);
      } finally {
        setLoadingShares(false);
      }
    };

    loadSharedStatus();
  }, [history, userId]);

  // Add error boundary and validation
  if (!history) {
    console.error("HistoryPanel: history prop is null or undefined");
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-4 flex-shrink-0">
          <HistoryIcon className="h-6 w-6 text-slate-500 dark:text-slate-400 mr-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analysis History</h3>
        </div>
        <div className="text-center py-10 flex-1">
          <p className="text-red-500 dark:text-red-400">Error: History data is not available</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Please refresh the page or try again.</p>
        </div>
      </div>
    );
  }

  // Validate history array
  if (!Array.isArray(history)) {
    console.error("HistoryPanel: history prop is not an array:", history);
    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center mb-4 flex-shrink-0">
          <HistoryIcon className="h-6 w-6 text-slate-500 dark:text-slate-400 mr-3" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analysis History</h3>
        </div>
        <div className="text-center py-10 flex-1">
          <p className="text-red-500 dark:text-red-400">Error: Invalid history data format</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Please refresh the page or try again.</p>
        </div>
      </div>
    );
  }

  console.log("HistoryPanel: Rendering with", history.length, "items");

  const handleSetOutcome = (trade: TradeAnalysis, status: 'profit' | 'stop-loss') => {
    setModalTrade(trade);
    setModalStatus(status);
    setOutcomeAmount('');
    setModalError(null);
    setShowOutcomeModal(true);
  };

  const handleSubmitOutcome = async () => {
    if (!modalTrade || !modalStatus || !userId) return;
    const amount = parseFloat(outcomeAmount);
    if (isNaN(amount)) {
      setModalError('Please enter a valid number for outcome amount.');
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      await updateTradeStatus(supabase, modalTrade.id, modalStatus, amount, userId);
      setShowOutcomeModal(false);
      setModalTrade(null);
      setModalStatus(null);
      setOutcomeAmount('');
      // Optionally, trigger a refresh in parent or reload data here
      window.location.reload(); // Simple way to refresh, or call a prop to reload history
    } catch (err) {
      setModalError('Failed to update trade status.');
    } finally {
      setModalLoading(false);
    }
  };

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
          {history.map((item, index) => {
            // Validate each item
            if (!item || !item.id || !item.tradeSetup) {
              console.error("HistoryPanel: Invalid item at index", index, item);
              return null;
            }

            const isSelected = currentAnalysisId === item.id;
            const isShared = sharedAnalyses.has(item.id);

            return (
              <li key={item.id} className="group">
                <div
                  className={`relative p-2 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 shadow-md'
                      : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => onSelect(item)}
                >
                  {/* Shared indicator */}
                  {isShared && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                        <CommunityIcon className="w-3 h-3 mr-1" />
                        Shared
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {item.mode}
                        </span>
                        <StatusBadge status={item.status} />
                        {isShared && (
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ Shared
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-1 sm:mb-2">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                          <span>Entry: ${item.tradeSetup.entryPrice}</span>
                          <span>SL: ${item.tradeSetup.stopLoss}</span>
                          <span>TP: ${item.tradeSetup.takeProfit}</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {new Date(item.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {/* Profit/Loss buttons for pending trades */}
                      {item.status === 'pending' && (
                        <div className="flex flex-row gap-1 sm:gap-2 mt-2">
                          <button
                            onClick={e => { e.stopPropagation(); handleSetOutcome(item, 'profit'); }}
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                          >
                            Set Profit
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleSetOutcome(item, 'stop-loss'); }}
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          >
                            Set Loss
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row gap-1 ml-2 sm:ml-4">
                      {onShareRequest && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isShared) {
                              onShareRequest(item);
                            }
                          }}
                          disabled={isShared || loadingShares}
                          className={`p-2 text-xs rounded-lg transition-colors ${
                            isShared 
                              ? 'text-green-600 dark:text-green-400 cursor-not-allowed' 
                              : 'text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30'
                          }`}
                          title={isShared ? 'Already shared to community' : 'Share to community'}
                        >
                          <CommunityIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRequest(item);
                        }}
                        className="p-2 text-xs rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete analysis"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {/* Outcome Modal */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {modalStatus === 'profit' ? 'Set Profit Outcome' : 'Set Loss Outcome'}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Outcome Amount
              </label>
              <input
                type="number"
                value={outcomeAmount}
                onChange={e => setOutcomeAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter outcome amount"
                min="0"
                step="any"
                disabled={modalLoading}
              />
            </div>
            {modalError && <div className="text-red-500 text-sm mb-2">{modalError}</div>}
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => setShowOutcomeModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={modalLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOutcome}
                disabled={modalLoading || !outcomeAmount}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {modalLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;