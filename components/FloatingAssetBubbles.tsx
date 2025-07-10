import React from 'react';

const assets = ['BTC', 'ETH', 'XAU', 'EUR/USD', 'AUD/JPY', 'SOL', 'USDC', 'DOGE', 'JPY', 'GBP', 'ADA', 'XRP', 'SPX', 'NDQ'];

const colors = [
  'bg-violet-500/20 border-violet-500/30 text-violet-700 dark:text-violet-200',
  'bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-200',
  'bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-200',
  'bg-pink-500/20 border-pink-500/30 text-pink-700 dark:text-pink-200',
  'bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-200',
];

const FloatingAssetBubbles: React.FC = () => {
  return (
    <>
      <div className="absolute inset-0 overflow-hidden z-0">
        {assets.map((asset, index) => {
          const size = 60 + Math.random() * 90;
          const colorClass = colors[index % colors.length];

          return (
            <div
              key={asset}
              className={`absolute flex items-center justify-center rounded-full font-bold shadow-lg animate-float-up select-none border ${colorClass}`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${5 + Math.random() * 90}%`,
                animationDuration: `${15 + Math.random() * 20}s`,
                animationDelay: `${Math.random() * 15}s`,
                bottom: '-150px',
                fontSize: `${Math.max(12, size / 6)}px`,
              }}
            >
              {asset}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.7;
          }
          100% {
            transform: translateY(-120vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-float-up {
          animation-name: float-up;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </>
  );
};

export default FloatingAssetBubbles;