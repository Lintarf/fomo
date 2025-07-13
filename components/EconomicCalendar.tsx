import React, { useState, useEffect } from 'react';
import { EconomicEvent } from '../types';
import { CalendarIcon } from './Icons';

const EconomicCalendar: React.FC = () => {
    const [events, setEvents] = useState<EconomicEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading economic events
        setTimeout(() => {
            setEvents([
                {
                    id: 1,
                    time: '2024-01-15T14:30:00Z',
                    currency: 'USD',
                    flag: '🇺🇸',
                    importance: 3,
                    event: 'Federal Reserve Interest Rate Decision',
                    actual: '5.50%',
                    forecast: '5.50%',
                    previous: '5.50%',
                    betterThanForecast: false
                },
                {
                    id: 2,
                    time: '2024-01-15T13:00:00Z',
                    currency: 'EUR',
                    flag: '🇪🇺',
                    importance: 2,
                    event: 'ECB President Lagarde Speech',
                    actual: undefined,
                    forecast: undefined,
                    previous: undefined,
                    betterThanForecast: undefined
                },
                {
                    id: 3,
                    time: '2024-01-15T12:30:00Z',
                    currency: 'GBP',
                    flag: '🇬🇧',
                    importance: 1,
                    event: 'UK CPI (YoY)',
                    actual: '3.9%',
                    forecast: '4.0%',
                    previous: '4.2%',
                    betterThanForecast: true
                }
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    const getImportanceColor = (importance: number) => {
        switch (importance) {
            case 3: return 'bg-red-500';
            case 2: return 'bg-yellow-500';
            case 1: return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const formatTime = (timeString: string) => {
        return new Date(timeString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6">
                <header>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Economic Calendar</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Track important economic events and their market impact.</p>
                </header>
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col gap-6 p-4 sm:p-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Economic Calendar</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Track important economic events and their market impact.</p>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-violet-600" />
                        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Today's Events</h2>
                    </div>
                </div>
                
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                    {events.map((event) => (
                        <div key={event.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{event.flag}</span>
                                        <div className={`w-3 h-3 rounded-full ${getImportanceColor(event.importance)}`}></div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{event.event}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {event.currency} • {formatTime(event.time)}
                                        </p>
                                    </div>
                                </div>
                                
                                {event.actual && (
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-slate-500 dark:text-slate-400">Actual:</span>
                                            <span className={`font-semibold ${
                                                event.betterThanForecast === true ? 'text-green-600 dark:text-green-400' :
                                                event.betterThanForecast === false ? 'text-red-600 dark:text-red-400' :
                                                'text-slate-800 dark:text-slate-100'
                                            }`}>
                                                {event.actual}
                                            </span>
                                        </div>
                                        {event.forecast && (
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                Forecast: {event.forecast}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Legend</h3>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-blue-700 dark:text-blue-300">High Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-blue-700 dark:text-blue-300">Medium Impact</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-blue-700 dark:text-blue-300">Low Impact</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EconomicCalendar;