import React, { useEffect, useRef } from 'react';
import { Asset } from '../types';

interface PortfolioPieChartProps {
    assets: Asset[];
    theme: 'light' | 'dark';
}

const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ assets, theme }) => {
    const chartContainer = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    // Consistent, nice-looking colors for the chart
    const chartColors = [
        '#8b5cf6', // Violet
        '#3b82f6', // Blue
        '#10b981', // Emerald
        '#f97316', // Orange
        '#ec4899', // Pink
        '#f59e0b', // Amber
        '#6366f1', // Indigo
        '#06b6d4', // Cyan
    ];
    
    const chartHoverColors = [
        '#7c3aed', 
        '#2563eb',
        '#059669',
        '#ea580c',
        '#db2777',
        '#d97706',
        '#4f46e5',
        '#0891b2',
    ];

    useEffect(() => {
        if (!chartContainer.current || !assets.length) return;
        
        const ctx = chartContainer.current.getContext('2d');
        if (!ctx) return;

        // Destroy the previous chart instance before creating a new one
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        
        const labels = assets.map(a => a.name);
        const data = assets.map(a => a.value);
        const backgroundColors = assets.map((_, i) => chartColors[i % chartColors.length]);
        const hoverBackgroundColors = assets.map((_, i) => chartHoverColors[i % chartHoverColors.length]);

        const isDark = theme === 'dark';
        const textColor = isDark ? 'rgba(203, 213, 225, 0.9)' : 'rgba(51, 65, 85, 1)';
        
        chartInstance.current = new (window as any).Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Portfolio Value',
                        data,
                        backgroundColor: backgroundColors,
                        hoverBackgroundColor: hoverBackgroundColors,
                        borderColor: isDark ? '#1f2937' : '#ffffff', // slate-800 or white
                        borderWidth: 2,
                        hoverOffset: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: textColor,
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 20,
                            font: { family: 'inherit', size: 12 },
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                        borderColor: isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 1)',
                        borderWidth: 1,
                        titleColor: isDark ? '#f1f5f9' : '#1e293b',
                        bodyColor: isDark ? '#94a3b8' : '#475569',
                        bodySpacing: 6,
                        padding: 12,
                        cornerRadius: 8,
                        usePointStyle: true,
                        callbacks: {
                            label: function(context: any) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed);
                                }
                                return label;
                            },
                            afterLabel: function(context: any) {
                                const total = context.chart.getDatasetMeta(0).total || 1;
                                const percentage = ((context.parsed / total) * 100).toFixed(2);
                                return `(${percentage}%)`;
                            }
                        }
                    },
                },
            },
        });

        // Cleanup function
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };

    }, [assets, theme]);

    return (
        <div className="relative h-96 w-full">
            {assets.length > 0 ? (
                <canvas ref={chartContainer} />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="text-slate-500 dark:text-slate-400 text-center">No assets in portfolio to display chart.</p>
                </div>
            )}
        </div>
    );
};

export default PortfolioPieChart;
