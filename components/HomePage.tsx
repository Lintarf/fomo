import React from 'react';
import { AppMode } from '../types';
import { AiIcon, DashboardIcon, TargetIcon } from './Icons';
import FloatingAssetBubbles from './FloatingAssetBubbles';
import TradingViewChartWidget from './TradingViewChartWidget';

interface HomePageProps {
    onNavigate?: (mode: AppMode) => void;
    user?: any;
    onLoginClick?: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
    <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg border border-slate-200/50 dark:border-slate-700/50 transition-transform transform hover:-translate-y-1">
        <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400">
            <div className="w-5 h-5 sm:w-6 sm:h-6">
                {icon}
            </div>
        </div>
        <h3 className="mt-4 sm:mt-5 text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigate, user, onLoginClick }) => {
    console.log('HomePage rendered, user:', user, 'onLoginClick:', typeof onLoginClick);
    
    return (
        <div className="flex-1 w-full flex flex-col pt-8 md:pt-12 px-4 md:px-8 pb-8">
            <main className="flex-1 relative flex flex-col justify-center items-center overflow-hidden min-h-[calc(100vh-4rem)]">
                <FloatingAssetBubbles />
                <TradingViewChartWidget />
                
                <section className="relative z-10 text-center px-4 sm:px-6 lg:px-8">
                    <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                        Welcome to <br />
                        <span className="text-violet-600 dark:text-violet-400">FOMO AI TRADING ANALYST</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                        Leverage the power of AI to analyze trading charts, identify key patterns, and gain actionable insights. Stop guessing, start analyzing.
                    </p>
                    {!user && (
                        <button
                            onClick={() => {
                                console.log('Get Started button clicked');
                                if (onLoginClick) onLoginClick();
                            }}
                            className="mt-6 sm:mt-8 px-6 sm:px-8 py-3 bg-violet-600 text-white font-semibold rounded-lg shadow-md hover:bg-violet-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:ring-offset-slate-900"
                        >
                            Get Started
                        </button>
                    )}
                </section>
            </main>

            <section className="bg-white dark:bg-slate-800 py-12 sm:py-20 relative z-10">
                 <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-8 sm:mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Unlock Your Trading Potential</h2>
                        <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400">Explore the powerful features designed to give you an edge.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
                        <FeatureCard
                            icon={<AiIcon className="w-6 h-6" />}
                            title="AI Chart Analysis"
                            description="Upload any trading chart screenshot and our Gemini-powered AI will provide a deep, unbiased technical analysis in seconds."
                        />
                        <FeatureCard
                            icon={<DashboardIcon className="w-6 h-6" />}
                            title="Performance Dashboard"
                            description="Track your win rate, analyze trade outcomes over time, and monitor your progress across different trading styles."
                        />
                        <FeatureCard
                            icon={<TargetIcon className="w-6 h-6" />}
                            title="Personalized Insights"
                            description="Receive AI-generated feedback on your trading performance, helping you identify strengths and areas for improvement."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;