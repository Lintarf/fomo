import {
    TradeAnalysis,
    TraderProfile,
    TraderTier
} from '../types';
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

export const getTraderProfile = (history: TradeAnalysis[]): TraderProfile => {
    const completedTrades = history.filter(t => t.status !== 'pending');
    const totalTrades = completedTrades.length;
    const wins = completedTrades.filter(t => t.status === 'profit').length;
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

    let tier: TraderTier = 'Novice Navigator';

    if (totalTrades >= 75 && winRate >= 75) {
        tier = 'Elite Executor';
    } else if (totalTrades >= 50 && winRate >= 65) {
        tier = 'Strategy Sentinel';
    } else if (totalTrades >= 30 && winRate >= 55) {
        tier = 'Pattern Pursuer';
    } else if (totalTrades >= 10 && winRate >= 40) {
        tier = 'Market Apprentice';
    }

    return {
        tier,
        ...tiers[tier],
    };
};
