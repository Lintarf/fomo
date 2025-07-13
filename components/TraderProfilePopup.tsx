import React, { useEffect, useState } from 'react';
import { TraderProfile, TraderTier } from '../types';
import { XCircleIcon } from './Icons';
import { getNextTierInfo, tiers } from '../utils/traderProfileHelper';

interface TraderProfilePopupProps {
    profile: TraderProfile;
    winRate: number;
    totalTrades: number;
    onClose: () => void;
}

const uniqueTiers = [
  { name: 'Novice Navigator', desc: 'You are just starting your trading journey.', requirement: '< 10 trade', rarity: 'common', colorClass: 'text-green-600' },
  { name: 'Market Apprentice', desc: 'Learning the ropes and gaining experience.', requirement: '≥ 10 trade', rarity: 'common', colorClass: 'text-green-600' },
  { name: 'Pattern Pursuer', desc: 'Spotting opportunities and building consistency.', requirement: '≥ 10 trade & win rate ≥ 40%', rarity: 'common', colorClass: 'text-green-600' },
  { name: 'Strategy Sentinel', desc: 'Strong discipline and robust strategy.', requirement: '≥ 20 trade & win rate ≥ 60%', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Elite Executor', desc: 'Mastery and exceptional performance.', requirement: '≥ 30 trade & win rate ≥ 80%', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Risk Master', desc: 'Low drawdown, high win rate.', requirement: '≥ 30 trade, max loss streak ≤ 3, win rate ≥ 70%', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Consistency Champion', desc: 'Never absent > 7 days, high win rate.', requirement: '≥ 40 trade, win rate ≥ 60%', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Comeback King/Queen', desc: 'Bounce back from big loss streak.', requirement: 'Loss streak ≥ 5, win streak ≥ 3', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Volume Virtuoso', desc: 'Huge trading volume.', requirement: 'Total nominal trading ≥ $100,000', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Profit Hunter', desc: 'Big net profit.', requirement: 'Total net profit ≥ $10,000', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Iron Hands', desc: 'Never cut loss > 2% equity.', requirement: '≥ 20 trade, no big cut loss', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Streak Specialist', desc: 'Long win streak.', requirement: 'Win streak ≥ 7', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Drawdown Dodger', desc: 'Never loss streak > 2 in 50 trade.', requirement: 'No loss streak > 2 in 50 trade', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Scalping Samurai', desc: 'Scalp master.', requirement: '≥ 50 scalp trade, win rate ≥ 60%', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Swing Strategist', desc: 'Swing master.', requirement: '≥ 30 swing trade, win rate ≥ 65%', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Day Dominator', desc: 'Day trade master.', requirement: '≥ 30 day trade, win rate ≥ 65%', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Position Prodigy', desc: 'Position trade master.', requirement: '≥ 20 position trade, win rate ≥ 70%', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Marathon Trader', desc: 'Active 100 days in a row.', requirement: 'Trading aktif 100 hari berturut-turut', rarity: 'legendary', colorClass: 'text-red-600' },
  { name: 'Untouchable', desc: '20 trade berturut-turut tanpa loss.', requirement: '20 win streak', rarity: 'legendary', colorClass: 'text-red-600' },
  { name: 'Comeback Legend', desc: 'Loss streak ≥ 10, win streak ≥ 10.', requirement: 'Loss streak ≥ 10, win streak ≥ 10', rarity: 'legendary', colorClass: 'text-red-600' },
  { name: 'Million Dollar Mindset', desc: 'Total trading ≥ $1,000,000.', requirement: 'Total nominal trading ≥ $1,000,000', rarity: 'legendary', colorClass: 'text-red-600' },
  { name: 'All-Mode Master', desc: 'Win rate ≥ 60% di semua mode.', requirement: 'Win rate ≥ 60% di scalp, day, swing, position', rarity: 'legendary', colorClass: 'text-red-600' },
  { name: 'Overnight Owl', desc: 'Trading aktif jam 00:00-04:00 > 30x.', requirement: '≥ 30 trade di jam 00:00-04:00', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'News Ninja', desc: 'Profit konsisten saat news besar.', requirement: '≥ 10 profit saat news besar', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Flash Crash Survivor', desc: 'Profit di hari flash crash.', requirement: 'Profit di hari flash crash', rarity: 'legendary', colorClass: 'text-red-600' },
  { name: 'Reversal Reader', desc: 'Profit dari reversal besar.', requirement: '≥ 10 profit dari reversal besar', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Breakout Boss', desc: 'Profit dari breakout.', requirement: '≥ 20 profit dari breakout', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Gap Guru', desc: 'Profit dari gap up/down.', requirement: '≥ 10 profit dari gap', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Risk Taker', desc: 'Pernah risk > 5% equity dan profit.', requirement: '≥ 5 trade risk > 5% equity dan profit', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Steady Hand', desc: 'Tidak pernah panic sell.', requirement: '≥ 50 trade tanpa panic sell', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Long Hauler', desc: 'Hold posisi > 30 hari dan profit.', requirement: '≥ 5 trade hold > 30 hari dan profit', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Short Slayer', desc: 'Profit konsisten dari short.', requirement: '≥ 20 profit dari short', rarity: 'epic', colorClass: 'text-orange-600' },
  { name: 'Quick Draw', desc: 'Profit dari entry/exit < 1 menit.', requirement: '≥ 10 profit entry/exit < 1 menit', rarity: 'rare', colorClass: 'text-violet-600' },
  { name: 'Overachiever', desc: 'Profit di semua mode dalam 1 minggu.', requirement: 'Profit di scalp, day, swing, position dalam 1 minggu', rarity: 'legendary', colorClass: 'text-red-600' },
];

const AllTiersPopup: React.FC<{ currentTier: string; onClose: () => void }> = ({ currentTier, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" aria-modal="true" role="dialog" onClick={onClose}>
    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl transform transition-all scale-100 opacity-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="absolute top-4 right-4">
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
          <XCircleIcon className="w-8 h-8" />
        </button>
      </div>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800 dark:text-slate-100">All Tiers & Achievements</h2>
        {['common', 'rare', 'epic', 'legendary'].map(rarity => (
          <div key={rarity}>
            <h4 className={`mb-2 mt-6 text-base font-bold uppercase tracking-wider ${
              rarity === 'common' ? 'text-green-600'
              : rarity === 'rare' ? 'text-violet-600'
              : rarity === 'epic' ? 'text-orange-600'
              : 'text-red-600'
            }`}>
              {rarity === 'common' ? 'Common Tiers'
                : rarity === 'rare' ? 'Rare Tiers'
                : rarity === 'epic' ? 'Epic Tiers'
                : 'Legendary Tiers'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {uniqueTiers.filter(t => t.rarity === rarity).map(tier => (
                <div key={tier.name} className={`flex flex-col gap-2 p-4 rounded-lg border ${tier.rarity === 'common' ? 'border-green-200 bg-green-50 dark:bg-green-900/10' : tier.rarity === 'rare' ? 'border-violet-300 bg-violet-50 dark:bg-violet-900/10' : tier.rarity === 'epic' ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : 'border-red-400 bg-red-50 dark:bg-red-900/10'} ${tier.name === currentTier ? 'ring-2 ring-violet-500' : ''}`}>
                  <span className={`text-lg font-bold ${tier.colorClass}`}>{tier.name}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mb-1">{tier.desc}</span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Cara: {tier.requirement}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const TraderProfilePopup: React.FC<TraderProfilePopupProps> = ({ profile, winRate, totalTrades, onClose }) => {
    const [showAllTiers, setShowAllTiers] = useState(false);
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                if (showAllTiers) setShowAllTiers(false);
                else onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose, showAllTiers]);
    const nextTierInfo = getNextTierInfo(profile.tier, totalTrades, winRate);
    const nextTierIcon = nextTierInfo.next ? tiers[nextTierInfo.next as TraderTier]?.image : null;
    return (
        <>
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 transition-opacity duration-300" 
            aria-modal="true"
            role="dialog"
            onClick={onClose}
        >
            <div 
                className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all scale-100 opacity-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute top-4 right-4">
                     <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                        <XCircleIcon className="w-8 h-8" />
                     </button>
                </div>
                <div className="p-8 text-center">
                    <div className="flex justify-center items-center h-48 w-48 mx-auto bg-violet-50 dark:bg-slate-700 rounded-full">
                        {React.createElement(profile.image, { className: 'h-32 w-32 text-violet-500 dark:text-violet-400' })}
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-slate-800 dark:text-slate-100">{profile.tier}</h2>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 max-w-xs mx-auto">{profile.description}</p>
                    {/* Next Tier Info */}
                    <div className="mt-8">
                      {nextTierInfo.next ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2">
                            {nextTierIcon && React.createElement(nextTierIcon, { className: 'h-10 w-10 text-blue-400 dark:text-blue-300' })}
                            <span className="text-lg font-semibold text-blue-600 dark:text-blue-300">Next tier: {nextTierInfo.next}</span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {nextTierInfo.desc} ({nextTierInfo.need > 0 ? `${nextTierInfo.need} trade lagi` : ''}{nextTierInfo.win ? `, win rate ${nextTierInfo.win}% lagi` : ''})
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Sudah di tier tertinggi</div>
                      )}
                    </div>
                    {/* Tombol Show All Tiers */}
                    <button
                      className="mt-6 px-4 py-2 rounded bg-violet-600 text-white font-semibold hover:bg-violet-700 transition"
                      onClick={() => setShowAllTiers(true)}
                    >
                      Show all tiers & achievements
                    </button>
                    <div className="mt-6 flex justify-center gap-6">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Win Rate</p>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{winRate}%</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Trades Completed</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalTrades}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {showAllTiers && <AllTiersPopup currentTier={profile.tier} onClose={() => setShowAllTiers(false)} />}
        </>
    );
};

export default TraderProfilePopup;