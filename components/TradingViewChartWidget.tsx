import React from 'react';

const TradingViewChartWidget: React.FC = () => {
    return (
        <>
            <div className="absolute top-1/2 left-1/2 w-[600px] h-[400px] opacity-10 dark:opacity-5 z-0 animate-subtle-float select-none">
                <svg width="100%" height="100%" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(124, 58, 237, 0.3)" />
                            <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
                        </linearGradient>
                    </defs>

                    <path d="M50 50 H550 M50 150 H550 M50 250 H550 M50 350 H550" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
                    <path d="M50 50 V350 M150 50 V350 M250 50 V350 M350 50 V350 M450 50 V350 M550 50 V350" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />

                    <path d="M50 300 C 150 100, 200 350, 300 200 S 400 50, 500 150 L 550 180" fill="url(#chart-gradient)" className="fade-in" />
                    
                    <path d="M50 300 C 150 100, 200 350, 300 200 S 400 50, 500 150 L 550 180" stroke="#7C3AED" strokeWidth="3" className="draw-chart-line" />
                    
                    <rect x="70" y="360" width="20" height="20" fill="#EF4444" className="fade-in" style={{animationDelay: '0.2s'}} />
                    <rect x="120" y="320" width="20" height="60" fill="#22C55E" className="fade-in" style={{animationDelay: '0.4s'}} />
                    <rect x="170" y="370" width="20" height="10" fill="#EF4444" className="fade-in" style={{animationDelay: '0.6s'}} />
                    <rect x="220" y="340" width="20" height="40" fill="#22C55E" className="fade-in" style={{animationDelay: '0.8s'}} />
                    <rect x="270" y="310" width="20" height="70" fill="#22C55E" className="fade-in" style={{animationDelay: '1s'}} />
                    <rect x="320" y="360" width="20" height="20" fill="#EF4444" className="fade-in" style={{animationDelay: '1.2s'}} />
                </svg>
            </div>
             <style>
                {`
                .draw-chart-line { stroke-dasharray: 2000; stroke-dashoffset: 2000; animation: draw-line 5s ease-out infinite alternate; }
                @keyframes draw-line { to { stroke-dashoffset: 0; } }
                
                .fade-in { animation: fade-in 2s ease-in-out infinite alternate; }
                @keyframes fade-in { 0% { opacity: 0.3; } 100% { opacity: 1; } }
                
                @keyframes subtle-float { 
                    0% { transform: translate(-50%, -50%) translateY(0px) rotate(-2deg); } 
                    50% { transform: translate(-50%, -50%) translateY(-20px) rotate(2deg); } 
                    100% { transform: translate(-50%, -50%) translateY(0px) rotate(-2deg); } 
                }
                .animate-subtle-float { 
                    animation-name: subtle-float; 
                    animation-duration: 10s; 
                    animation-timing-function: ease-in-out; 
                    animation-iteration-count: infinite; 
                }
                `}
            </style>
        </>
    );
};
export default TradingViewChartWidget;