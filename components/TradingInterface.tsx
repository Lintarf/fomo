import React, { useState, useCallback, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { TradeAnalysis, TradingMode, RiskParameters, TokenUsage, ApiStatus } from '../types';
import ImageUploader from './ImageUploader';
import AnalysisResult from './AnalysisResult';
import TradeSetupCalculator from './TradeSetupCalculator';
import ActiveRiskParameters from './ActiveRiskParameters';
import { analyzeChart } from '../services/geminiService';
import * as supabaseService from '../services/supabaseService';
import { shareAnalysisToCommunity } from '../services/supabaseService';
import { AiIcon, ArrowLeftIcon } from './Icons';
import HistoryPanel from './HistoryPanel';
import ConfirmationModal from './ConfirmationModal';

interface TradingInterfaceProps {
    user: User;
    apiKey: string;
    apiStatus: ApiStatus;
    updateTokenUsage: (usage: TokenUsage) => void;
    onTradeAdded: (trade: TradeAnalysis) => void;
    tradeHistory: TradeAnalysis[];
    currentEquity: number;
    onTradeDeleted: (id: string) => void;
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({
    user,
    apiKey,
    apiStatus,
    updateTokenUsage,
    onTradeAdded,
    tradeHistory,
    currentEquity,
    onTradeDeleted
}) => {
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<TradeAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tradingMode, setTradingMode] = useState<TradingMode>('day');
    const [riskParams, setRiskParams] = useState<RiskParameters>({
        accountBalance: '1000',
        riskPerTrade: '1',
        stopLoss: '0.5',
        leverage: '10',
        riskRewardRatio: '2',
        entryPrice: '0',
        currentEquity: 1000
    });
    const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
    // 1. Add a handler to select a history item and show its analysis
    const [selectedHistory, setSelectedHistory] = useState<TradeAnalysis | null>(null);
    // Tambahkan state
    const [tradeToDelete, setTradeToDelete] = useState<TradeAnalysis | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [tradeToShare, setTradeToShare] = useState<TradeAnalysis | null>(null);

    const timeframeSettings = {
        scalp: { text: "Timeframe: 1m, 3m, 5m, 15m (minute) only", link: "https://www.tradingview.com/symbols/" },
        day: { text: "Timeframe: 30m (minute) only", link: "https://www.tradingview.com/symbols/" },
        swing: { text: "Timeframe: 1h, 2h, 4h, 12h (hour) only", link: "https://www.tradingview.com/symbols/" },
        position: { text: "Timeframe: 1d, 1w, 1M (day/week/month) only", link: "https://www.tradingview.com/symbols/" }
    };

    const handleImageSelect = useCallback((file: File) => {
        setSelectedImage(file);
        setError(null);
        
        // Create preview immediately when file is selected
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setImagePreview(result);
            console.log('Image preview set:', !!result);
        };
        reader.onerror = () => {
            console.error('Error creating image preview');
            setError('Failed to create image preview. Please try again.');
        };
        reader.readAsDataURL(file);
    }, []);

    // 2. Update handleAnalyze to auto-save after analysis
    const handleAnalyze = async () => {
        if (!selectedImage || !apiKey) {
            setError('Please select an image and ensure API key is configured.');
            return;
        }
        
        // Ensure imagePreview is available
        if (!imagePreview) {
            setError('Image preview is not available. Please try uploading the image again.');
            return;
        }
        
        setIsAnalyzing(true);
        setError(null);
        try {
            const { analysis: analysisResult, usage } = await analyzeChart(
                apiKey,
                selectedImage,
                riskParams,
                tradingMode,
                riskParams.currentEquity || 1000
            );
            updateTokenUsage(usage);
            
            // If the analysisResult contains an error, set it as the analysis object for AnalysisResult
            if (analysisResult && analysisResult.error) {
                setAnalysis({ error: analysisResult.error } as any);
                setSelectedHistory(null);
                return;
            }
            
            // Update riskParams with latest equity and risk from analysis
            setRiskParams(prev => ({
                ...prev,
                currentEquity: prev.currentEquity || 1000,
                riskPerTrade: analysisResult.riskPerTrade !== undefined ? String(analysisResult.riskPerTrade) : prev.riskPerTrade
            }));
            
            // Ensure image is always set
            const tradeAnalysis: TradeAnalysis = {
                id: Date.now().toString(),
                timestamp: new Date().toISOString(),
                image: imagePreview, // Always use imagePreview, never empty string
                mode: (analysisResult as any).mode || tradingMode, // gunakan mode hasil mapping AI
                marketTrend: analysisResult.marketTrend,
                keyPattern: analysisResult.keyPattern,
                indicatorAnalysis: analysisResult.indicatorAnalysis,
                tradeBias: analysisResult.tradeBias,
                tradeSetup: analysisResult.tradeSetup,
                rationale: analysisResult.rationale,
                confidenceScore: analysisResult.confidenceScore,
                status: 'pending',
                riskPerTrade: analysisResult.riskPerTrade
            };
            
            console.log('TradeAnalysis created with image:', !!tradeAnalysis.image);
            setAnalysis(tradeAnalysis);
            setSelectedHistory(null);
            
            // Auto-save after analysis
            if (supabaseService.supabase) {
                try {
                    const savedTrade = await supabaseService.addTrade(
                        supabaseService.supabase,
                        tradeAnalysis,
                        user.id
                    );
                    onTradeAdded(savedTrade);
                } catch (err: any) {
                    console.error('Auto-save error:', err);
                    setError('Failed to auto-save trade: ' + err.message);
                }
            }
        } catch (err: any) {
            console.error('Analysis error:', err);
            setError(err.message || 'Failed to analyze chart. Please try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveTrade = async () => {
        if (!analysis || !supabaseService.supabase) {
            setError('No analysis to save or database connection failed.');
            return;
        }

        try {
            const savedTrade = await supabaseService.addTrade(
                supabaseService.supabase,
                analysis,
                user.id
            );
            onTradeAdded(savedTrade);
            setError(null);
            // Show success message
            alert('Trade saved successfully!');
        } catch (err: any) {
            console.error('Save error:', err);
            setError('Failed to save trade: ' + err.message);
        }
    };

    const handleBackToUploader = () => {
        setSelectedImage(null);
        setImagePreview(null);
        setAnalysis(null);
        setSelectedHistory(null); // Also reset selected history
        setError(null);
    };

    const handleRiskParamsChange = (newParams: Partial<RiskParameters>) => {
        setRiskParams(prev => ({ ...prev, ...newParams }));
    };

    // 3. HistoryPanel onSelect handler
    const handleHistorySelect = (item: TradeAnalysis) => {
        setAnalysis(item);
        setSelectedHistory(item);
        setSelectedImage(null);
        setImagePreview(item.image || null);
    };

    // Handler untuk request hapus
    const handleDeleteRequest = (trade: TradeAnalysis) => {
      setTradeToDelete(trade);
      setIsDeleteModalOpen(true);
    };

    // Handler konfirmasi hapus
    const handleConfirmDelete = () => {
      if (tradeToDelete) {
        // Hapus trade dari history (bisa disesuaikan dengan cara update state/DB)
        onTradeDeleted(tradeToDelete.id); // Pastikan ada prop/fungsi ini, atau update state tradeHistory di sini
        setTradeToDelete(null);
        setIsDeleteModalOpen(false);
      }
    };

    // Handler batal
    const handleCancelDelete = () => {
      setTradeToDelete(null);
      setIsDeleteModalOpen(false);
    };

    // Tambahkan handler share
    const handleShareRequest = (trade: TradeAnalysis) => {
      setTradeToShare(trade);
      setShareModalOpen(true);
    };

    const handleConfirmShare = async () => {
      if (!tradeToShare) return;
      
      try {
        // First, ensure the trade is saved to the database
        let savedTrade = tradeToShare;
        
        // Check if this trade is already in the database by looking for it in tradeHistory
        const existingTrade = tradeHistory.find(t => t.id === tradeToShare.id);
        
        if (!existingTrade) {
          // If not in database, save it first
          if (supabaseService.supabase) {
            savedTrade = await supabaseService.addTrade(
              supabaseService.supabase,
              tradeToShare,
              user.id
            );
            // Add to local history
            onTradeAdded(savedTrade);
          }
        }
        
        // Now share to community with the correct analysis_id
        const shareResult = await shareAnalysisToCommunity(supabaseService.supabase, user.id, savedTrade);
        
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
        
        // Close modal
        setShareModalOpen(false);
        setTradeToShare(null);
        
      } catch (err: any) {
        console.error('Error sharing to community:', err);
        
        // Show error message with modern notification
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
        notification.textContent = '❌ Gagal share ke komunitas: ' + (err.message || err);
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

    const handleCancelShare = () => {
      setShareModalOpen(false);
      setTradeToShare(null);
    };

    // Add filtered history based on current trading mode
    const filteredHistory = tradeHistory.filter(item => item.mode === tradingMode);

    // Update useEffect to depend on imagePreview and apiKey
    useEffect(() => {
        if (!selectedHistory && imagePreview && apiKey) {
            handleAnalyze();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imagePreview, apiKey, selectedHistory]);

    // Sync riskParams.currentEquity with prop currentEquity
    useEffect(() => {
        setRiskParams(prev => ({
            ...prev,
            currentEquity: currentEquity || 0
        }));
    }, [currentEquity]);

    return (
        <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6">
            <header className="flex items-center gap-4">
                <button
                    onClick={handleBackToUploader}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    title="Back to upload new image"
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
                        AI Trading Analysis
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {selectedHistory ? 'Viewing historical analysis' : 'Upload a chart screenshot for AI-powered technical analysis'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <strong>Mapping Timeframe:</strong> <br/>
                        <span>1m/3m/5m/15m = <b>Scalp</b>, 30m = <b>Day</b>, 1h/2h/4h/12h = <b>Swing</b>, 1d/1w/1M = <b>Position</b></span>
                    </p>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {!analysis ? (
                <div className="flex-1 flex flex-col lg:flex-row gap-6">
                    {/* Left side - Image upload and analysis */}
                    <div className="flex-1 flex flex-col gap-6">
                        {/* Trading mode selector */}
                        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">
                                Trading Mode
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(['scalp', 'day', 'swing', 'position'] as TradingMode[]).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setTradingMode(mode)}
                                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                            tradingMode === mode
                                                ? 'bg-violet-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    {timeframeSettings[tradingMode].text}
                                </p>
                            </div>
                        </div>

                        {/* Image uploader */}
                        <div className="flex-1">
                            <ImageUploader
                                onImageSelect={handleImageSelect}
                                isLoading={isAnalyzing}
                                isTradingMode={true}
                                preview={imagePreview}
                            />
                        </div>

                        {apiStatus !== 'valid' && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
                                <p className="text-sm">
                                    Please configure your API key in Settings to use AI analysis.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right side - Risk parameters and calculator */}
                    <div className="lg:w-96">
                        <div className="sticky top-6">
                            <div className="flex mb-4 gap-2">
                                <button
                                    className={`flex-1 px-3 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'calculator' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    onClick={() => setActiveTab('calculator')}
                                >Calculator</button>
                                <button
                                    className={`flex-1 px-3 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'history' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    onClick={() => setActiveTab('history')}
                                >History</button>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-b-lg border border-slate-200 dark:border-slate-700">
                                {activeTab === 'calculator' && (
                                    <TradeSetupCalculator
                                        params={riskParams}
                                        timeframeSettings={timeframeSettings[tradingMode]}
                                    />
                                )}
                                {activeTab === 'history' && (
                                    <HistoryPanel
                                        history={filteredHistory}
                                        onSelect={handleHistorySelect}
                                        onDeleteRequest={handleDeleteRequest}
                                        onShareRequest={handleShareRequest}
                                        currentAnalysisId={
                                            selectedHistory ? (selectedHistory as TradeAnalysis).id :
                                            analysis ? (analysis as TradeAnalysis).id : undefined
                                        }
                                        userId={user.id}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Analysis result view */
                <div className="flex-1 flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        <AnalysisResult
                            analysis={analysis}
                            riskParams={riskParams}
                            onBackToUploader={handleBackToUploader}
                        />
                    </div>
                    <div className="lg:w-96">
                        <div className="sticky top-6">
                            <div className="flex mb-4 gap-2">
                                <button
                                    className={`flex-1 px-3 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'calculator' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    onClick={() => setActiveTab('calculator')}
                                >Calculator</button>
                                <button
                                    className={`flex-1 px-3 py-2 rounded-t-lg font-medium text-sm transition-colors ${activeTab === 'history' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                    onClick={() => setActiveTab('history')}
                                >History</button>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-b-lg border border-slate-200 dark:border-slate-700">
                                {activeTab === 'calculator' && (
                                    <TradeSetupCalculator
                                        params={riskParams}
                                        timeframeSettings={timeframeSettings[tradingMode]}
                                    />
                                )}
                                {activeTab === 'history' && (
                                    <HistoryPanel
                                        history={filteredHistory}
                                        onSelect={handleHistorySelect}
                                        onDeleteRequest={handleDeleteRequest}
                                        onShareRequest={handleShareRequest}
                                        currentAnalysisId={
                                            selectedHistory ? (selectedHistory as TradeAnalysis).id :
                                            analysis ? (analysis as TradeAnalysis).id : undefined
                                        }
                                        userId={user.id}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <ConfirmationModal
              isOpen={isDeleteModalOpen}
              onClose={handleCancelDelete}
              onConfirm={handleConfirmDelete}
              title="Hapus Analisa?"
              message={tradeToDelete ? `Yakin ingin menghapus analisa trade ${tradeToDelete.tradeSetup?.tradeType || ''} pada ${new Date(tradeToDelete.timestamp).toLocaleString()}?` : ''}
              confirmText="Hapus"
              cancelText="Batal"
              isDestructive
            />
            <ConfirmationModal
              isOpen={shareModalOpen}
              onClose={handleCancelShare}
              onConfirm={handleConfirmShare}
              title="Share Analisa ke Komunitas?"
              message="Analisa ini akan dibagikan ke menu Community dan bisa dilihat user lain."
              confirmText="Share"
              cancelText="Batal"
              isDestructive={false}
            />
        </div>
    );
};

export default TradingInterface; 