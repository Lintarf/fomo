import React from 'react';

export type TradingMode = 'scalp' | 'swing' | 'day' | 'position';
export type DashboardMode = TradingMode | 'all';
export type AppMode = 'home' | 'dashboard' | TradingMode | 'settings' | 'economic-calendar' | 'portfolio';

export type TraderTier = 'Novice Navigator' | 'Market Apprentice' | 'Pattern Pursuer' | 'Strategy Sentinel' | 'Elite Executor';

export interface TraderProfile {
  tier: TraderTier;
  description: string;
  icon: React.FC<{ className?: string }>;
  image: React.FC<{ className?: string }>;
}


export interface RiskParameters {
  accountBalance: string;
  riskPerTrade: string;
  stopLoss: string;
  leverage: string;
  riskRewardRatio: string;
  entryPrice: string;
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
  tradeSetup: TradeSetup;
  rationale: string;
  confidenceScore: number;
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
  symbol: string;
  name: string;
  logoUrl: string;
  amount: number;
  avgBuyPrice: number;
  currentPrice: number;
  value: number;
  totalPl: number;
}

export interface PortfolioData {
  assets: Asset[];
  totalValue: number;
  totalPl: number;
  pl24h: number;
  pl24hPercent: number;
}

export type ApiStatus = 'idle' | 'verifying' | 'valid' | 'invalid';