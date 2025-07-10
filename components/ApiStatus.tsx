import React from 'react';
import { ApiStatus } from '../types';

interface ApiStatusProps {
    apiStatus: ApiStatus;
    sessionTokens: number;
    totalTokens: number;
}

const ApiStatusIndicator: React.FC<ApiStatusProps> = ({ apiStatus, sessionTokens, totalTokens }) => {

    const formatTokens = (tokens: number) => {
        return new Intl.NumberFormat().format(tokens);
    };

    const statusConfig = {
        idle: { text: 'Not Configured', color: 'bg-slate-400', pulse: false },
        verifying: { text: 'Verifying...', color: 'bg-yellow-400', pulse: true },
        valid: { text: 'Active', color: 'bg-emerald-400', pulse: false },
        invalid: { text: 'Invalid Key', color: 'bg-red-500', pulse: false },
    };

    const currentStatus = statusConfig[apiStatus];

    return (
        <div className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg text-xs space-y-2">
            <div className="flex items-center gap-2">
                 <span className={`relative flex h-2 w-2`}>
                    <span className={`absolute inline-flex h-full w-full rounded-full ${currentStatus.color} ${currentStatus.pulse ? 'animate-ping' : ''} opacity-75`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${currentStatus.color}`}></span>
                </span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">AI Engine: {currentStatus.text}</span>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-600 my-1"></div>
            <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Session Tokens:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatTokens(sessionTokens)}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Total Tokens Used:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">{formatTokens(totalTokens)}</span>
            </div>
        </div>
    );
};

export default ApiStatusIndicator;