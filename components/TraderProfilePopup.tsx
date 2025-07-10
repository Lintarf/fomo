import React, { useEffect } from 'react';
import { TraderProfile } from '../types';
import { XCircleIcon } from './Icons';

interface TraderProfilePopupProps {
    profile: TraderProfile;
    winRate: number;
    totalTrades: number;
    onClose: () => void;
}

const TraderProfilePopup: React.FC<TraderProfilePopupProps> = ({ profile, winRate, totalTrades, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEsc);

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    return (
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
    );
};

export default TraderProfilePopup;