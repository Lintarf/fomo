import React from 'react';

export type TradingMode = 'scalp' | 'swing' | 'day' | 'position';
export type DashboardMode = TradingMode | 'all';
export type AppMode = 'home' | 'dashboard' | TradingMode | 'settings' | 'economic-calendar' | 'portfolio' | 'community';

export type TraderTier = 'Novice Navigator' | 'Market Apprentice' | 'Pattern Pursuer' | 'Strategy Sentinel' | 'Elite Executor';

export interface TraderProfile {
  tier: TraderTier;
  description: string;
  icon: React.FC<{ className?: string }>;
  image: React.FC<{ className?: string }>;
  badges?: string[];
}


export interface RiskParameters {
  accountBalance: string;
  riskPerTrade: string;
  stopLoss: string;
  leverage: string;
  riskRewardRatio: string;
  entryPrice: string;
  currentEquity?: number;
}

export interface TradeSetup {
  tradeType: "Long" | "Short";
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
}

export interface TradeAnalysis {
  id: string;
  timestamp: string;
  image: string;
  mode: TradingMode;
  marketTrend: string;
  keyPattern: string;
  indicatorAnalysis: string;
  tradeBias: string;
  confidenceScore: number;
  riskPerTrade: number;
  leverage?: number;
  profitAmount?: number;
  error?: string;
  tradeSetup: {
    tradeType: string;
    entryPrice: number;
    stopLoss: number;
    takeProfit: number;
    rrr: number;
  };
  rationale: string;
  status: 'pending' | 'profit' | 'stop-loss';
  outcomeAmount?: number;
}

export interface TokenUsage {
    prompt: number;
    completion: number;
    total: number;
}

export interface EconomicEvent {
  id: number;
  time: string;
  currency: string;
  flag: string;
  importance: 1 | 2 | 3;
  event: string;
  actual?: string;
  forecast?: string;
  previous?: string;
  betterThanForecast?: boolean;
}

export interface Asset {
  id?: string;
  symbol: string;
  name: string;
  logoUrl?: string; // frontend usage
  logo_url?: string; // backend compatibility
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  value?: number;
  totalPl?: number;
  category?: string; // Add category for asset classification
}

export interface PortfolioAsset {
  id: string;
  user_id: string;
  symbol: string;
  name: string;
  logo_url: string;
  amount: number;
  avg_buy_price: number;
  current_price: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioData {
  assets: Asset[];
  totalValue: number;
  totalPl: number;
  pl24h: number;
  pl24hPercent: number;
}

export type ApiStatus = 'idle' | 'verifying' | 'valid' | 'invalid';

// New interfaces for enhanced performance analytics
export interface AdvancedMetrics {
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  bestTrade: number;
  worstTrade: number;
  sharpeRatio?: number;
  totalTrades: number;
  winRate: number;
  totalWins: number;
  totalLosses: number;
}

export interface PsychologyMetrics {
  currentMood: 'confident' | 'nervous' | 'excited' | 'calm' | 'frustrated' | 'neutral';
  stressLevel: number; // 1-10 scale
  emotionalPattern: string; // e.g., "Calm → Profitable", "Nervous → Losses"
  recentEmotions: Array<{
    tradeId: string;
    preTradeMood: string;
    postTradeEmotion: string;
    stressLevel: number;
    timestamp: string;
  }>;
}

export interface EnhancedPerformanceData {
  basic: {
    initialCapital: number;
    netPL: number;
    currentEquity: number;
    totalTrades: number;
  };
  advanced: AdvancedMetrics;
  psychology: PsychologyMetrics;
}

// Community Types
export interface CommunityAnalysis {
  id: string;
  user_id: string;
  analysis_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  is_featured: boolean;
  // Joined data
  user_name?: string;
  user_email?: string;
  trade_analysis?: TradeAnalysis;
}

export interface CommunityComment {
  id: string;
  user_id: string;
  analysis_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // Joined data
  user_name?: string;
  user_email?: string;
}

export interface CommunityLike {
  id: string;
  user_id: string;
  analysis_id: string;
  like_type: 'like' | 'dislike';
  created_at: string;
}

export interface UserCommunityRead {
  id: string;
  user_id: string;
  last_read_at: string;
}

export interface CommunityStats {
  total_analyses: number;
  total_comments: number;
  total_likes: number;
  unread_count: number;
}