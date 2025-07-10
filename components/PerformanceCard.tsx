import React from 'react';

interface PerformanceCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'emerald' | 'green' | 'red' | 'violet' | 'orange';
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/50 dark:text-red-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-900/50 dark:text-violet-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400',
};

const valueColorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    green: 'text-green-600 dark:text-green-500',
    red: 'text-red-600 dark:text-red-500',
    violet: 'text-violet-600 dark:text-violet-400',
    orange: 'text-orange-600 dark:text-orange-500',
};


const PerformanceCard: React.FC<PerformanceCardProps> = ({ label, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
        </div>
      </div>
      <p className={`text-4xl font-bold mt-4 ${valueColorClasses[color]}`}>{value}</p>
    </div>
  );
};

export default PerformanceCard;