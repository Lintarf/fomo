import { TradeAnalysis, TraderProfile, AdvancedMetrics, PsychologyMetrics, TraderTier } from '../types';
import {
  NoviceNavigatorIcon,
  MarketApprenticeIcon,
  PatternPursuerIcon,
  StrategySentinelIcon,
  EliteExecutorIcon
} from '../components/Icons';

const tiers: Record<TraderTier, Omit<TraderProfile, 'tier'>> = {
    'Novice Navigator': {
        description: "You're at the beginning of your trading journey, exploring the markets. Every trade is a valuable lesson.",
        icon: NoviceNavigatorIcon,
        image: NoviceNavigatorIcon, 
    },
    'Market Apprentice': {
        description: "You're gaining experience and learning the ropes. Consistency is developing, and you're starting to understand market movements.",
        icon: MarketApprenticeIcon,
        image: MarketApprenticeIcon,
    },
    'Pattern Pursuer': {
        description: "You have a knack for spotting opportunities and are developing a consistent approach. Your discipline is starting to pay off.",
        icon: PatternPursuerIcon,
        image: PatternPursuerIcon,
    },
    'Strategy Sentinel': {
        description: "You trade with a clear plan and strong discipline. Your strategy is robust, leading to consistent positive results.",
        icon: StrategySentinelIcon,
        image: StrategySentinelIcon,
    },
    'Elite Executor': {
        description: "You operate at a high level of precision and mastery. Your execution is sharp, and your performance is exceptional.",
        icon: EliteExecutorIcon,
        image: EliteExecutorIcon,
    },
};

export { tiers };

export const getTraderProfile = (history: TradeAnalysis[]): TraderProfile => {
    const completedTrades = history.filter(t => t.status !== 'pending');
    const totalTrades = completedTrades.length;
    const wins = completedTrades.filter(t => t.status === 'profit').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
    const totalProfit = completedTrades.filter(t => t.status === 'profit').reduce((acc, t) => acc + (t.outcomeAmount || 0), 0);
    const totalVolume = completedTrades.reduce((acc, t) => acc + (parseFloat(t.tradeSetup.entryPrice) || 0), 0);
    // Drawdown: max loss streak
    let maxLossStreak = 0, currLossStreak = 0;
    let maxWinStreak = 0, currWinStreak = 0;
    let lastTradeDate: Date | null = null;
    let maxAbsence = 0;
    completedTrades.forEach((t) => {
        if (t.status === 'stop-loss') {
            currLossStreak++;
            maxLossStreak = Math.max(maxLossStreak, currLossStreak);
            currWinStreak = 0;
        } else if (t.status === 'profit') {
            currWinStreak++;
            maxWinStreak = Math.max(maxWinStreak, currWinStreak);
            currLossStreak = 0;
        }
        // Absence logic
        if (t.timestamp) {
            const date = new Date(t.timestamp);
            if (lastTradeDate) {
                const diff = Math.floor((date.getTime() - lastTradeDate.getTime()) / (1000 * 60 * 60 * 24));
                maxAbsence = Math.max(maxAbsence, diff);
            }
            lastTradeDate = new Date(t.timestamp);
        }
    });

    // --- Tier utama ---
    let tier: TraderTier = 'Novice Navigator';
    if (totalTrades >= 30 && winRate >= 80) {
        tier = 'Elite Executor';
    } else if (totalTrades >= 20 && winRate >= 60) {
        tier = 'Strategy Sentinel';
    } else if (totalTrades >= 10 && winRate >= 40) {
        tier = 'Pattern Pursuer';
    } else if (totalTrades >= 10) {
        tier = 'Market Apprentice';
    }

    // --- Badge unik ---
    const badges: string[] = [];
    if (totalTrades >= 30 && maxLossStreak <= 3 && winRate >= 70) badges.push('Risk Master');
    if (totalTrades >= 40 && maxAbsence <= 7 && winRate >= 60) badges.push('Consistency Champion');
    if (maxLossStreak >= 5 && maxWinStreak >= 3) badges.push('Comeback King/Queen');
    if (totalVolume >= 100000) badges.push('Volume Virtuoso');
    if (totalProfit >= 10000) badges.push('Profit Hunter');
    if (totalTrades >= 20 && completedTrades.every(t => (t.status !== 'stop-loss' || (t.outcomeAmount || 0) >= -0.02))) badges.push('Iron Hands');
    if (maxWinStreak >= 7) badges.push('Streak Specialist');
    // Tambah badge unik lain di sini sesuai kebutuhan

    return {
        tier,
        ...tiers[tier],
        badges,
    };
};

export function getNextTierInfo(currentTier: TraderTier, totalTrades: number, winRate: number) {
  switch (currentTier) {
    case 'Novice Navigator':
      return { next: 'Market Apprentice', need: Math.max(10 - totalTrades, 0), desc: 'Selesaikan 10 trade' };
    case 'Market Apprentice':
      return { next: 'Pattern Pursuer', need: Math.max(30 - totalTrades, 0), win: winRate < 40 ? 40 - winRate : 0, desc: '30 trade & win rate ≥ 40%' };
    case 'Pattern Pursuer':
      return { next: 'Strategy Sentinel', need: Math.max(60 - totalTrades, 0), win: winRate < 50 ? 50 - winRate : 0, desc: '60 trade & win rate ≥ 50%' };
    case 'Strategy Sentinel':
      return { next: 'Elite Executor', need: Math.max(100 - totalTrades, 0), win: winRate < 60 ? 60 - winRate : 0, desc: '100 trade & win rate ≥ 60%' };
    default:
      return { next: null, need: 0, desc: 'Tier tertinggi' };
  }
}

// New helper functions for enhanced performance analytics
export const calculateAdvancedMetrics = (trades: TradeAnalysis[]): AdvancedMetrics => {
  const completedTrades = trades.filter(t => t.status !== 'pending');
  const wins = completedTrades.filter(t => t.status === 'profit');
  const losses = completedTrades.filter(t => t.status === 'stop-loss');
  
  const totalWins = wins.length;
  const totalLosses = losses.length;
  const totalTrades = completedTrades.length;
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  
  // Calculate average win/loss
  const totalWinAmount = wins.reduce((sum, trade) => sum + (trade.outcomeAmount || 0), 0);
  const totalLossAmount = losses.reduce((sum, trade) => sum + (trade.outcomeAmount || 0), 0);
  const averageWin = totalWins > 0 ? totalWinAmount / totalWins : 0;
  const averageLoss = totalLosses > 0 ? totalLossAmount / totalLosses : 0;
  
  // Calculate profit factor
  const profitFactor = totalLossAmount > 0 ? totalWinAmount / totalLossAmount : 0;
  
  // Calculate max drawdown (simplified)
  let maxDrawdown = 0;
  let runningPL = 0;
  let peak = 0;
  
  completedTrades.forEach(trade => {
    if (trade.status === 'profit') {
      runningPL += trade.outcomeAmount || 0;
    } else {
      runningPL -= trade.outcomeAmount || 0;
    }
    
    if (runningPL > peak) {
      peak = runningPL;
    }
    
    const drawdown = peak - runningPL;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });
  
  // Find best and worst trades
  const bestTrade = wins.length > 0 ? Math.max(...wins.map(t => t.outcomeAmount || 0)) : 0;
  const worstTrade = losses.length > 0 ? Math.max(...losses.map(t => t.outcomeAmount || 0)) : 0;
  
  return {
    averageWin,
    averageLoss,
    profitFactor,
    maxDrawdown,
    bestTrade,
    worstTrade,
    totalTrades,
    winRate,
    totalWins,
    totalLosses
  };
};

export const calculatePsychologyMetrics = (trades: TradeAnalysis[]): PsychologyMetrics => {
  // For now, we'll use simulated psychology data
  // In a real implementation, this would come from user input or AI analysis
  
  const completedTrades = trades.filter(t => t.status !== 'pending');
  const recentTrades = completedTrades.slice(-5); // Last 5 trades
  
  // Simulate psychology data based on performance
  const recentWinRate = recentTrades.length > 0 
    ? recentTrades.filter(t => t.status === 'profit').length / recentTrades.length 
    : 0.5;
  
  let currentMood: PsychologyMetrics['currentMood'] = 'neutral';
  let stressLevel = 5;
  let emotionalPattern = 'Neutral pattern';
  
  if (recentWinRate >= 0.8) {
    currentMood = 'confident';
    stressLevel = 2;
    emotionalPattern = 'Confident → High Performance';
  } else if (recentWinRate >= 0.6) {
    currentMood = 'calm';
    stressLevel = 3;
    emotionalPattern = 'Calm → Consistent Results';
  } else if (recentWinRate >= 0.4) {
    currentMood = 'nervous';
    stressLevel = 6;
    emotionalPattern = 'Nervous → Mixed Results';
  } else {
    currentMood = 'frustrated';
    stressLevel = 8;
    emotionalPattern = 'Frustrated → Poor Performance';
  }
  
  // Simulate recent emotions data
  const recentEmotions = recentTrades.map((trade, index) => ({
    tradeId: trade.id,
    preTradeMood: ['confident', 'calm', 'nervous', 'excited'][index % 4] as string,
    postTradeEmotion: trade.status === 'profit' ? 'happy' : 'frustrated',
    stressLevel: Math.floor(Math.random() * 5) + 3,
    timestamp: trade.timestamp
  }));
  
  return {
    currentMood,
    stressLevel,
    emotionalPattern,
    recentEmotions
  };
};

export const getMoodEmoji = (mood: PsychologyMetrics['currentMood']): string => {
  const emojiMap = {
    confident: '😊',
    nervous: '😰',
    excited: '🤩',
    calm: '😌',
    frustrated: '😤',
    neutral: '😐'
  };
  return emojiMap[mood];
};

export const getStressColor = (level: number): string => {
  if (level <= 3) return 'text-green-600 dark:text-green-400';
  if (level <= 6) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
};
