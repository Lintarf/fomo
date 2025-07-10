import React, { useState, useMemo } from 'react';
import { EconomicEvent } from '../types';
import { InfoIcon } from './Icons';

const allEvents: EconomicEvent[] = [
    { id: 1, time: "00:30", currency: "AUD", flag: "🇦🇺", importance: 3, event: "RBA Interest Rate Decision", actual: "3.85%", forecast: "3.60%", previous: "3.85%", betterThanForecast: true },
    { id: 2, time: "00:30", currency: "AUD", flag: "🇦🇺", importance: 2, event: "RBA Rate Statement", },
    { id: 3, time: "01:00", currency: "JPY", flag: "🇯🇵", importance: 1, event: "Economy Watchers Current Index (Jun)", actual: "45.0", forecast: "45.1", previous: "44.4", betterThanForecast: false },
    { id: 4, time: "02:00", currency: "EUR", flag: "🇪🇺", importance: 2, event: "German Exports (MoM) (May)", actual: "-1.4%", forecast: "-0.2%", previous: "-1.6%", betterThanForecast: false },
    { id: 5, time: "02:00", currency: "EUR", flag: "🇪🇺", importance: 2, event: "German Imports (MoM) (May)", actual: "-3.8%", forecast: "", previous: "2.2%", betterThanForecast: false },
    { id: 6, time: "02:00", currency: "EUR", flag: "🇪🇺", importance: 3, event: "German Trade Balance (May)", actual: "18.4B", forecast: "15.7B", previous: "15.8B", betterThanForecast: true },
    { id: 7, time: "05:30", currency: "USD", flag: "🇺🇸", importance: 3, event: "Consumer Price Index (YoY) (Jun)", forecast: "3.1%", previous: "4.0%" },
    { id: 8, time: "05:30", currency: "USD", flag: "🇺🇸", importance: 3, event: "Core CPI (YoY) (Jun)", forecast: "5.0%", previous: "5.3%" },
    { id: 9, time: "09:00", currency: "CAD", flag: "🇨🇦", importance: 3, event: "BoC Interest Rate Decision", forecast: "4.75%", previous: "4.50%" },
    { id: 10, time: "11:30", currency: "USD", flag: "🇺🇸", importance: 2, event: "Crude Oil Inventories", previous: "-1.508M" },
    { id: 11, time: "01:30", currency: "CNY", flag: "🇨🇳", importance: 2, event: "Trade Balance (USD) (Jun)", forecast: "74.8B", previous: "65.81B" },
    { id: 12, time: "05:30", currency: "USD", flag: "🇺🇸", importance: 3, event: "Producer Price Index (MoM) (Jun)", forecast: "0.2%", previous: "-0.3%" },
    { id: 13, time: "07:00", currency: "GBP", flag: "🇬🇧", importance: 2, event: "GDP (MoM) (May)", forecast: "-0.2%", previous: "0.2%" },
];


const Disclaimer: React.FC = () => (
  <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 p-4 rounded-lg mb-6">
    <div className="flex">
      <div className="flex-shrink-0">
        <InfoIcon className="h-5 w-5 text-blue-400 dark:text-blue-500" />
      </div>
      <div className="ml-3">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-bold">Demonstration Only:</span><br />
          This Economic Calendar is a high-fidelity demo and uses static data. Real-time data integration requires a dedicated backend service or an official data provider API due to browser security restrictions (CORS).
        </p>
      </div>
    </div>
  </div>
);

type FilterType = 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek';

const EconomicCalendar: React.FC = () => {
    const [filter, setFilter] = useState<FilterType>('today');
    
    const filteredEvents = useMemo(() => {
        switch(filter) {
            case 'today':
                return allEvents.slice(0, 10);
            case 'tomorrow':
                return allEvents.slice(10);
            case 'thisWeek':
                return allEvents;
            case 'nextWeek':
                return [];
            default:
                return allEvents;
        }
    }, [filter]);

    const FilterButton: React.FC<{buttonFilter: FilterType, children: React.ReactNode}> = ({buttonFilter, children}) => (
        <button
            onClick={() => setFilter(buttonFilter)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                filter === buttonFilter 
                ? 'bg-violet-600 text-white shadow' 
                : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
        >
            {children}
        </button>
    );
    
    const ImportanceStars: React.FC<{ count: number }> = ({ count }) => (
        <div className="flex items-center gap-0.5">
            {[...Array(3)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < count ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-600'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
    
    const DataCell: React.FC<{value?: string, better?: boolean}> = ({value, better}) => {
        const colorClass = better === undefined ? 'text-slate-800 dark:text-slate-100' 
                         : better ? 'text-emerald-600 dark:text-emerald-400'
                         : 'text-red-600 dark:text-red-400';
        return <td className={`px-4 py-3 text-sm font-semibold text-right ${colorClass}`}>{value || '-'}</td>
    }


    return (
        <div className="flex-1 flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Economic Calendar</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Key market-moving events and indicators.</p>
            </header>

            <Disclaimer />

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <FilterButton buttonFilter="today">Today</FilterButton>
                    <FilterButton buttonFilter="tomorrow">Tomorrow</FilterButton>
                    <FilterButton buttonFilter="thisWeek">This Week</FilterButton>
                    <FilterButton buttonFilter="nextWeek">Next Week</FilterButton>
                </div>
                
                <div className="overflow-x-auto">
                     <table className="w-full min-w-[600px]">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Time</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cur.</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Imp.</th>
                                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Event</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actual</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Forecast</th>
                                <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Previous</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredEvents.length > 0 ? filteredEvents.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium">{item.time}</td>
                                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span>{item.flag}</span>
                                            <span>{item.currency}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><ImportanceStars count={item.importance} /></td>
                                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-medium">{item.event}</td>
                                    <DataCell value={item.actual} better={item.betterThanForecast} />
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-right">{item.forecast || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-right">{item.previous || '-'}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-slate-500 dark:text-slate-400">
                                        No events to display for this period.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default EconomicCalendar;