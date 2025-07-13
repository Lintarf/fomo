import React, { useState, useEffect, useRef } from 'react';
import { TradeAnalysis } from '../types';

interface PerformanceChartProps {
    history: TradeAnalysis[];
}

type Timeframe = 'daily' | 'weekly' | 'monthly';

const getWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const aggregateData = (history: TradeAnalysis[], timeframe: Timeframe) => {
    if (history.length === 0) {
        return { labels: [], profitData: [], lossData: [], pendingData: [], cumulativePlData: [] };
    }

    const sortedHistory = [...history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const data: { [key: string]: { profit: number; loss: number; pending: number; pl: number } } = {};

    sortedHistory.forEach(trade => {
        const date = new Date(trade.timestamp);
        let key = '';

        if (timeframe === 'daily') {
            key = date.toLocaleDateString('en-CA');
        } else if (timeframe === 'weekly') {
            const year = date.getFullYear();
            const week = getWeek(date);
            key = `${year}-W${week.toString().padStart(2, '0')}`;
        } else {
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        }

        if (!data[key]) {
            data[key] = { profit: 0, loss: 0, pending: 0, pl: 0 };
        }

        switch (trade.status) {
            case 'profit':
                data[key].profit += 1;
                data[key].pl += trade.outcomeAmount || 0;
                break;
            case 'stop-loss':
                data[key].loss += 1;
                data[key].pl -= trade.outcomeAmount || 0;
                break;
            case 'pending':
                data[key].pending += 1;
                break;
        }
    });
    
    const sortedKeys = Object.keys(data).sort();
    
    const labels = sortedKeys;
    const profitData = sortedKeys.map(key => data[key].profit);
    const lossData = sortedKeys.map(key => data[key].loss);
    const pendingData = sortedKeys.map(key => data[key].pending);
    
    const cumulativePlData: number[] = [];
    let runningTotal = 0;
    sortedKeys.forEach(key => {
        runningTotal += data[key].pl;
        cumulativePlData.push(runningTotal);
    });

    return { labels, profitData, lossData, pendingData, cumulativePlData };
};

interface TimeframeButtonProps {
    buttonTimeframe: Timeframe;
    activeTimeframe: Timeframe;
    setTimeframe: (timeframe: Timeframe) => void;
    children: React.ReactNode;
}

const TimeframeButton: React.FC<TimeframeButtonProps> = ({buttonTimeframe, activeTimeframe, setTimeframe, children}) => (
    <button
        onClick={() => setTimeframe(buttonTimeframe)}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
            activeTimeframe === buttonTimeframe 
            ? 'bg-violet-600 text-white' 
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
        }`}
    >
        {children}
    </button>
);

const PerformanceChart: React.FC<PerformanceChartProps> = ({ history }) => {
    const chartContainer = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);
    const [timeframe, setTimeframe] = useState<Timeframe>('daily');

    useEffect(() => {
        if (!chartContainer.current) return;
        
        const ctx = chartContainer.current.getContext('2d');
        if (!ctx) return;

        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const { labels, profitData, lossData, pendingData, cumulativePlData } = aggregateData(history, timeframe);
        
        const isDark = false; // Removed theme prop, so default to light
        const gridColor = isDark ? 'rgba(71, 85, 105, 0.2)' : 'rgba(203, 213, 225, 0.5)';
        const textColor = isDark ? 'rgba(203, 213, 225, 0.8)' : 'rgba(100, 116, 139, 1)';
        
        // Create gradients
        const profitGradient = ctx.createLinearGradient(0, 0, 0, 300);
        profitGradient.addColorStop(0, isDark ? 'rgba(34, 197, 94, 0.7)' : 'rgba(34, 197, 94, 0.8)');
        profitGradient.addColorStop(1, isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.4)');

        const lossGradient = ctx.createLinearGradient(0, 0, 0, 300);
        lossGradient.addColorStop(0, isDark ? 'rgba(239, 68, 68, 0.7)' : 'rgba(239, 68, 68, 0.8)');
        lossGradient.addColorStop(1, isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)');

        const pendingGradient = ctx.createLinearGradient(0, 0, 0, 300);
        pendingGradient.addColorStop(0, isDark ? 'rgba(100, 116, 139, 0.6)' : 'rgba(100, 116, 139, 0.7)');
        pendingGradient.addColorStop(1, isDark ? 'rgba(100, 116, 139, 0.2)' : 'rgba(100, 116, 139, 0.3)');

        const lineGradient = ctx.createLinearGradient(0, 50, 0, 300);
        lineGradient.addColorStop(0, isDark ? 'rgba(124, 58, 237, 0.4)' : 'rgba(124, 58, 237, 0.5)');
        lineGradient.addColorStop(1, isDark ? 'rgba(124, 58, 237, 0.05)' : 'rgba(124, 58, 237, 0.05)');


        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Profit',
                        data: profitData,
                        backgroundColor: profitGradient,
                        borderColor: 'rgba(34, 197, 94, 0)',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'Stack 0',
                    },
                    {
                        label: 'Stop Loss',
                        data: lossData,
                        backgroundColor: lossGradient,
                        borderColor: 'rgba(239, 68, 68, 0)',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'Stack 0',
                    },
                     {
                        label: 'Pending',
                        data: pendingData,
                        backgroundColor: pendingGradient,
                        borderColor: 'rgba(100, 116, 139, 0)',
                        borderWidth: 0,
                        borderRadius: 4,
                        stack: 'Stack 0',
                    },
                    {
                        type: 'line',
                        label: 'Cumulative P/L',
                        data: cumulativePlData,
                        borderColor: 'rgba(124, 58, 237, 1)',
                        backgroundColor: lineGradient,
                        borderWidth: 3,
                        yAxisID: 'y1',
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointBackgroundColor: 'rgba(124, 58, 237, 1)',
                        pointBorderColor: isDark ? '#1e293b' : '#fff',
                        pointHoverBackgroundColor: 'rgba(124, 58, 237, 1)',
                        pointHoverBorderColor: isDark ? '#1e293b' : '#fff',
                        pointHoverBorderWidth: 2,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: { display: false },
                        ticks: { color: textColor, font: { family: 'inherit'} },
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: { 
                            color: gridColor,
                            drawBorder: false,
                            borderDash: [5, 5],
                        },
                        ticks: {
                           stepSize: 1,
                           color: textColor,
                           font: { family: 'inherit'}
                        },
                        title: {
                            display: true,
                            text: 'Number of Trades',
                            color: textColor,
                            font: { size: 12, weight: '500', family: 'inherit'}
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: { drawOnChartArea: false, },
                        ticks: { 
                            color: textColor, 
                            font: { family: 'inherit'},
                            callback: function(value: any) {
                                if (typeof value !== 'number') return value;
                                if (Math.abs(value) >= 1000) {
                                    return '$' + (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
                                }
                                return '$' + value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Cumulative P/L ($)',
                            color: textColor,
                            font: { size: 12, weight: '500', family: 'inherit'}
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: textColor,
                            usePointStyle: true,
                            boxWidth: 8,
                            font: { family: 'inherit'}
                        }
                    },
                    tooltip: {
                        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        borderColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 1)',
                        borderWidth: 1,
                        titleColor: isDark ? '#cbd5e1' : '#1e293b',
                        bodyColor: isDark ? '#94a3b8' : '#475569',
                        bodySpacing: 8,
                        titleSpacing: 6,
                        padding: 12,
                        cornerRadius: 8,
                        boxPadding: 4,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context: any) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if(context.dataset.yAxisID === 'y1') {
                                        label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                    } else {
                                        label += context.parsed.y;
                                    }
                                }
                                return label;
                            }
                        }
                    },
                },
            },
        });


        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };

    }, [history, timeframe]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Trade Outcomes Over Time</h3>
                <div className="flex items-center gap-2">
                    <TimeframeButton buttonTimeframe="daily" activeTimeframe={timeframe} setTimeframe={setTimeframe}>Daily</TimeframeButton>
                    <TimeframeButton buttonTimeframe="weekly" activeTimeframe={timeframe} setTimeframe={setTimeframe}>Weekly</TimeframeButton>
                    <TimeframeButton buttonTimeframe="monthly" activeTimeframe={timeframe} setTimeframe={setTimeframe}>Monthly</TimeframeButton>
                </div>
            </div>
            <div className="relative h-96">
                {history.length > 0 ? (
                    <canvas ref={chartContainer} />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-slate-500 dark:text-slate-400 text-center">No completed trade data to display. <br/> Complete some trades to see the chart.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PerformanceChart;