import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseService';
import { 
  getCommunityAnalyses, 
  addComment, 
  getComments, 
  toggleLike, 
  getUserLike,
  updateUserCommunityRead,
  getCommunityStats,
  shareAnalysis,
  shareAnalysisToCommunity
} from '../services/supabaseService';
import { CommunityAnalysis, CommunityComment, CommunityStats, TradeAnalysis, RiskParameters } from '../types';
import { User } from '@supabase/supabase-js';
import AnalysisResult from './AnalysisResult';

interface CommunityProps {
  user: User;
}

// Helper to safely check trade_analysis validity (strict, nested in trade_setup)
function isValidTradeAnalysis(trade_analysis: any): boolean {
  if (!trade_analysis || typeof trade_analysis !== 'object') return false;
  const setup = trade_analysis.trade_setup;
  if (!setup || typeof setup !== 'object') return false;
  const requiredFields = ['tradeType', 'entryPrice', 'stopLoss', 'takeProfit', 'rrr'];
  for (const field of requiredFields) {
    if (
      !(field in setup) ||
      setup[field] === null ||
      setup[field] === undefined ||
      (typeof setup[field] === 'number' && isNaN(setup[field]))
    ) {
      return false;
    }
  }
  return true;
}

export const Community: React.FC<CommunityProps> = ({ user }) => {
  const [analyses, setAnalyses] = useState<CommunityAnalysis[]>([]);
  const [stats, setStats] = useState<CommunityStats>({
    total_analyses: 0,
    total_comments: 0,
    total_likes: 0,
    unread_count: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<CommunityAnalysis | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [userLikes, setUserLikes] = useState<Record<string, 'like' | 'dislike' | null>>({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [selectedTradeForShare, setSelectedTradeForShare] = useState<TradeAnalysis | null>(null);
  const [expandedAnalysisId, setExpandedAnalysisId] = useState<string | null>(null);
  const [listComments, setListComments] = useState<Record<string, CommunityComment[]>>({});
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);
  const [previousAnalysisCount, setPreviousAnalysisCount] = useState<number>(0);
  const [hasNewData, setHasNewData] = useState<boolean>(false);

  // Add a default riskParams for preview (since community doesn't have user risk params)
  const defaultRiskParams: RiskParameters = {
    accountBalance: '1000',
    riskPerTrade: '1',
    stopLoss: '0.5',
    leverage: '10',
    riskRewardRatio: '2',
    entryPrice: '0',
    currentEquity: 1000
  };

  useEffect(() => {
    if (user) {
      loadCommunityData();
      updateUserCommunityRead(supabase, user.id);
    }
  }, [user]);

  // Auto-refresh community data every 30 seconds
  useEffect(() => {
    if (!user) return;
    
    // Hanya auto-refresh jika tidak sedang preview detail atau di modal share
    if (selectedAnalysis || showShareModal) return;

    const interval = setInterval(async () => {
      try {
        // Reload data di background tanpa mengganggu UI
        const [newAnalyses, newStats] = await Promise.all([
          getCommunityAnalyses(supabase, 20, 0),
          getCommunityStats(supabase, user.id)
        ]);
        
        // Update state secara silent tanpa loading indicator
        setAnalyses(newAnalyses);
        setStats(newStats);
        
        // Cek apakah ada data baru
        if (newAnalyses.length > previousAnalysisCount && previousAnalysisCount > 0) {
          setHasNewData(true);
          // Tampilkan notifikasi subtle
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm transform transition-all duration-300 translate-x-full';
          notification.textContent = `🆕 ${newAnalyses.length - previousAnalysisCount} new analysis(es) available`;
          document.body.appendChild(notification);
          
          setTimeout(() => notification.classList.remove('translate-x-full'), 100);
          setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => document.body.removeChild(notification), 300);
          }, 3000);
        }
        
        setPreviousAnalysisCount(newAnalyses.length);
        
        // Update user likes untuk analisa yang baru
        const userLikesPromises = newAnalyses.map(analysis => 
          getUserLike(supabase, analysis.id, user.id)
        );
        const userLikesResults = await Promise.all(userLikesPromises);
        const newUserLikes: Record<string, 'like' | 'dislike' | null> = {};
        newAnalyses.forEach((analysis, index) => {
          newUserLikes[analysis.id] = userLikesResults[index];
        });
        setUserLikes(newUserLikes);
        
      } catch (error) {
        console.warn('Background refresh failed:', error);
        // Jangan tampilkan error ke user untuk background refresh
      }
    }, 30000); // 30 detik

    return () => clearInterval(interval);
  }, [user, selectedAnalysis, showShareModal]);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      const [analysesData, statsData] = await Promise.all([
        getCommunityAnalyses(supabase, 20, 0),
        getCommunityStats(supabase, user.id)
      ]);
      
      setAnalyses(analysesData);
      setStats(statsData);
      setPreviousAnalysisCount(analysesData.length); // Inisialisasi count
      
      // Load user likes for all analyses
      const userLikesPromises = analysesData.map(analysis => 
        getUserLike(supabase, analysis.id, user.id)
      );
      const userLikesResults = await Promise.all(userLikesPromises);
      const userLikesMap: Record<string, 'like' | 'dislike' | null> = {};
      analysesData.forEach((analysis, index) => {
        userLikesMap[analysis.id] = userLikesResults[index];
      });
      setUserLikes(userLikesMap);
      
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalysisClick = async (analysis: CommunityAnalysis) => {
    setSelectedAnalysis(analysis);
    try {
      const commentsData = await getComments(supabase, analysis.id);
      setComments(commentsData);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedAnalysis || !newComment.trim()) return;
    
    try {
      const comment = await addComment(supabase, selectedAnalysis.id, newComment, user.id);
      setComments([...comments, comment]);
      setNewComment('');
      
      // Update comments count in the analysis
      setAnalyses(prev => prev.map(a => 
        a.id === selectedAnalysis.id 
          ? { ...a, comments_count: a.comments_count + 1 }
          : a
      ));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleToggleLike = async (analysisId: string, likeType: 'like' | 'dislike') => {
    if (!user) return;
    
    try {
      await toggleLike(supabase, analysisId, likeType, user.id);
      
      // Update local state
      const currentLike = userLikes[analysisId];
      const newLike = currentLike === likeType ? null : likeType;
      setUserLikes(prev => ({ ...prev, [analysisId]: newLike }));
      
      // Update counts in analyses
      setAnalyses(prev => prev.map(a => {
        if (a.id === analysisId) {
          let likesCount = a.likes_count;
          let dislikesCount = a.dislikes_count;
          
          if (currentLike === 'like') likesCount--;
          if (currentLike === 'dislike') dislikesCount--;
          if (newLike === 'like') likesCount++;
          if (newLike === 'dislike') dislikesCount++;
          
          return { ...a, likes_count: likesCount, dislikes_count: dislikesCount };
        }
        return a;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleShareAnalysis = async (trade: TradeAnalysis) => {
    setSelectedTradeForShare(trade);
    setShowShareModal(true);
  };

  const confirmShareAnalysis = async () => {
    if (!user || !selectedTradeForShare || !shareTitle.trim()) return;
    
    try {
      await shareAnalysisToCommunity(supabase, user.id, selectedTradeForShare, shareTitle, shareDescription);
      setShowShareModal(false);
      setShareTitle('');
      setShareDescription('');
      setSelectedTradeForShare(null);
      
      // Reload community data to show the new shared analysis
      await loadCommunityData();
      
      // Show success message with modern notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      notification.textContent = '✅ Analisis berhasil di-share ke komunitas!';
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 100);
      
      // Animate out and remove
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 3000);
      
    } catch (error) {
      console.error('Error sharing analysis:', error);
      
      // Show error message with modern notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      notification.textContent = '❌ Gagal share ke komunitas: ' + (error instanceof Error ? error.message : 'Unknown error');
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 100);
      
      // Animate out and remove
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 5000);
    }
  };

  const handleManualRefresh = async () => {
    setLoading(true);
    try {
      await loadCommunityData();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleListComments = async (analysisId: string) => {
    if (expandedAnalysisId === analysisId) {
      setExpandedAnalysisId(null);
      return;
    }
    setExpandedAnalysisId(analysisId);
    if (!listComments[analysisId]) {
      setLoadingCommentsId(analysisId);
      const commentsData = await getComments(supabase, analysisId);
      setListComments(prev => ({ ...prev, [analysisId]: commentsData }));
      setLoadingCommentsId(null);
    }
  };

  const handleShowNewData = () => {
    setHasNewData(false);
    setSelectedAnalysis(null); // Reset preview jika ada
    // Data sudah ter-update, jadi tidak perlu reload lagi
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 w-full">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">Share insights and learn from fellow traders</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {hasNewData && (
                <button
                  onClick={handleShowNewData}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors animate-pulse"
                >
                  🆕 Show New
                </button>
              )}
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              <div className="flex flex-row sm:flex-col items-center gap-1">
                <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total_analyses}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Analyses</div>
              </div>
              <div className="flex flex-row sm:flex-col items-center gap-1">
                <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total_comments}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Comments</div>
              </div>
              <div className="flex flex-row sm:flex-col items-center gap-1">
                <div className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total_likes}</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Likes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Modern Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preview Panel (Left, Large) */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 min-h-[500px] flex flex-col">
              {!user ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <span className="text-5xl mb-4">🔒</span>
                  <span>Silakan login untuk melihat detail analisis komunitas.</span>
                </div>
              ) : selectedAnalysis ? (
                selectedAnalysis.trade_analysis ? (
                  (() => {
                    const raw = selectedAnalysis.trade_analysis || {};
                    const tradeSetup = (raw as any).tradeSetup || (raw as any).trade_setup || {};
                    const analysis = {
                      ...raw,
                      tradeSetup: {
                        tradeType: (tradeSetup as any).tradeType || (tradeSetup as any).trade_type || '',
                        entryPrice: (tradeSetup as any).entryPrice ?? (tradeSetup as any).entry_price ?? 0,
                        stopLoss: (tradeSetup as any).stopLoss ?? (tradeSetup as any).stop_loss ?? 0,
                        takeProfit: (tradeSetup as any).takeProfit ?? (tradeSetup as any).take_profit ?? 0,
                        rrr: (tradeSetup as any).rrr ?? 0,
                      },
                      marketTrend: (raw as any).marketTrend || (raw as any).market_trend || '',
                      keyPattern: (raw as any).keyPattern || (raw as any).key_pattern || '',
                      indicatorAnalysis: (raw as any).indicatorAnalysis || (raw as any).indicator_analysis || '',
                      tradeBias: (raw as any).tradeBias || (raw as any).trade_bias || '',
                      confidenceScore: (raw as any).confidenceScore ?? (raw as any).confidence_score ?? 0,
                      rationale: Array.isArray((raw as any).rationale) ? (raw as any).rationale.join('\n') : ((raw as any).rationale || ''),
                      status: (raw as any).status || 'pending',
                      id: (raw as any).id || (selectedAnalysis as any).analysis_id || (selectedAnalysis as any).id || '',
                      timestamp: (raw as any).timestamp || (raw as any).created_at || '',
                      image: (raw as any).image || '',
                      mode: (raw as any).mode || '',
                    };
                    return (
                      <>
                        <h3 className="text-xl font-bold text-violet-700 dark:text-violet-300 mb-4">{selectedAnalysis.title || 'Tanpa Judul'}</h3>
                        <AnalysisResult
                          analysis={analysis}
                          riskParams={defaultRiskParams}
                        />
                      </>
                    );
                  })()
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-red-400 dark:text-red-500">
                    <span className="text-5xl mb-4">⚠️</span>
                    <span>Data analisis tidak ditemukan.</span>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <span className="text-5xl mb-4">📝</span>
                  <span>Select an analysis to view details</span>
                </div>
              )}
            </div>
          </div>
          {/* List Panel (Right, Small) */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Analyses</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">Click to preview</span>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {analyses.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-gray-400 dark:text-gray-500 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No analyses yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Be the first to share your trading analysis with the community!
                    </p>
                  </div>
                ) : (
                  analyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      onClick={() => handleAnalysisClick(analysis)}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow p-4 flex flex-col gap-2 border transition-all duration-200 cursor-pointer hover:shadow-md ${
                        selectedAnalysis?.id === analysis.id 
                          ? 'border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20 shadow-violet-200 dark:shadow-violet-900/30' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-blue-400 flex items-center justify-center text-white font-bold text-lg shadow">
                          {analysis.user_email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">{analysis.title || 'Tanpa Judul'}</h3>
                          </div>
                          <p className={`text-xs ${analysis.description ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 italic'} mb-1`}>
                            {analysis.description || '(Tidak ada deskripsi)'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span>by <span className="font-medium text-violet-600 dark:text-violet-400">{analysis.user_email || 'Anonymous'}</span></span>
                        <span>{formatDate(analysis.created_at)}</span>
                        <span>💬 {analysis.comments_count ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleLike(analysis.id, 'like'); }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${userLikes[analysis.id] === 'like' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30'}`}
                          title="Like"
                        >
                          👍 {analysis.likes_count ?? 0}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleLike(analysis.id, 'dislike'); }}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${userLikes[analysis.id] === 'dislike' ? 'bg-red-100 text-red-600 dark:bg-red-900/60' : 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`}
                          title="Dislike"
                        >
                          👎 {analysis.dislikes_count ?? 0}
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleListComments(analysis.id); }}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                        >
                          💬 {expandedAnalysisId === analysis.id ? 'Hide' : 'Show'} Comments
                        </button>
                      </div>
                      {expandedAnalysisId === analysis.id && (
                        <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-2 w-full border border-gray-200 dark:border-gray-700">
                          {/* Daftar komentar */}
                          <div className="max-h-32 overflow-y-auto space-y-2 mb-2">
                            {loadingCommentsId === analysis.id ? (
                              <div className="text-gray-400 italic">Loading...</div>
                            ) : (
                              (listComments[analysis.id]?.length
                                ? listComments[analysis.id].map(comment => (
                                    <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 py-1 text-xs">
                                      <div>{comment.content}</div>
                                      <div className="text-gray-400">{comment.user_email || 'Anonymous'}</div>
                                    </div>
                                  ))
                                : <div className="text-gray-400 italic">No comments yet.</div>
                              )
                            )}
                          </div>
                          {/* Form tambah komentar */}
                          {user && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newComment}
                                onChange={e => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs"
                              />
                              <button
                                onClick={async () => {
                                  if (!newComment.trim()) return;
                                  const comment = await addComment(supabase, analysis.id, newComment, user.id);
                                  setListComments(prev => ({
                                    ...prev,
                                    [analysis.id]: [...(prev[analysis.id] || []), comment]
                                  }));
                                  setAnalyses(prev => prev.map(a =>
                                    a.id === analysis.id ? { ...a, comments_count: (a.comments_count ?? 0) + 1 } : a
                                  ));
                                  setNewComment('');
                                }}
                                disabled={!newComment.trim()}
                                className="px-3 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 text-xs"
                              >
                                Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Share Analysis
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter a title for your analysis..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Add a description..."
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={confirmShareAnalysis}
                disabled={!shareTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Share
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

export default Community; 