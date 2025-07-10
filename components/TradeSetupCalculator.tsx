import React, { useState, useEffect, useMemo } from 'react';
import { RiskParameters, TradeAnalysis } from '../types';
import { CalculatorIcon } from './Icons';

interface TradeSetupCalculatorProps {
  params: RiskParameters;
  setParams: React.Dispatch<React.SetStateAction<RiskParameters>>;
  timeframeSettings: {
    text: string;
    link: string;
  };
  currentAnalysis: TradeAnalysis | null;
}

interface InputFieldProps {
  id: keyof Omit<RiskParameters, 'leverage'> | 'exitPrice';
  label: string;
  value: string;
  recommendation?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}

const InputField: React.FC<InputFieldProps & { error?: string }> = ({ id, label, value, recommendation, onChange, placeholder, type = "text", error }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
        </label>
        <div className="mt-1">
            <input
                type={type}
                name={id}
                id={id}
                className="shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
        {recommendation && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{recommendation}</p>}
    </div>
);

const ResultField: React.FC<{ label: string; value: string; className?: string }> = ({ label, value, className = '' }) => (
    <div className={`flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0 ${className}`}>
        <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
        <p className={`text-sm font-semibold ${className || 'text-slate-800 dark:text-slate-100'}`}>{value}</p>
    </div>
);

const TradeSetupCalculator: React.FC<TradeSetupCalculatorProps> = ({ params, setParams, timeframeSettings, currentAnalysis }) => {
    
    const [exitPrice, setExitPrice] = useState('');
    const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
    
    const parseLocaleNumber = (str: string) => {
        if (typeof str !== 'string' && typeof str !== 'number') return NaN;
        return parseFloat(String(str).replace(',', '.'));
    }

    const calculatedResults = useMemo(() => {
        const balance = parseLocaleNumber(params.accountBalance);
        const riskPercent = parseLocaleNumber(params.riskPerTrade);
        const stopLossDistance = parseLocaleNumber(params.stopLoss);
        const leverage = parseLocaleNumber(params.leverage);
        const riskRewardRatio = parseLocaleNumber(params.riskRewardRatio);
        const entryPrice = parseLocaleNumber(params.entryPrice);

        const allInputsValid = ![balance, riskPercent, stopLossDistance, leverage, riskRewardRatio, entryPrice].some(isNaN);

        if (!allInputsValid) {
            return { positionSize: 'Invalid Input', marginRequired: 'Invalid Input', potentialProfit: 'Invalid Input', potentialLoss: 'Invalid Input', takeProfitPrice: 'Invalid Input' };
        }
        
        if (stopLossDistance <= 0 || leverage <= 0 || riskRewardRatio <= 0 || balance <= 0 || entryPrice <= 0) {
            return { positionSize: 'N/A', marginRequired: 'N/A', potentialProfit: 'N/A', potentialLoss: 'N/A', takeProfitPrice: 'N/A' };
        }

        const riskAmount = balance * (riskPercent / 100);
        const positionSize = riskAmount / stopLossDistance;
        const positionValue = positionSize * entryPrice;
        const marginRequired = positionValue / leverage;
        const takeProfitDistance = stopLossDistance * riskRewardRatio;
        const potentialProfit = riskAmount * riskRewardRatio;
        
        const takeProfitPrice = positionType === 'LONG'
            ? entryPrice + takeProfitDistance
            : entryPrice - takeProfitDistance;

        return {
            positionSize: positionSize.toFixed(8),
            marginRequired: `$${marginRequired.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            potentialProfit: `$${potentialProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            potentialLoss: `$${riskAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            takeProfitPrice: takeProfitPrice.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 8 }),
        };
    }, [params, positionType]);
    
    const pnlResults = useMemo(() => {
        const entry = parseLocaleNumber(params.entryPrice);
        const exit = parseLocaleNumber(exitPrice);
        const positionSize = parseLocaleNumber(calculatedResults.positionSize);
        const leverage = parseLocaleNumber(params.leverage);

        if ([entry, exit, positionSize, leverage].some(isNaN) || positionSize <= 0 || entry <= 0 || leverage <= 0 || exit <= 0) {
            return { initialMargin: 'N/A', pnl: 'N/A', pnlColor: 'text-slate-800 dark:text-slate-100', liquidationPrice: 'N/A' };
        }

        const initialMargin = (entry * positionSize) / leverage;
        let pnl = 0;
        let liquidationPrice = 0;

        if (positionType === 'LONG') {
            pnl = (exit - entry) * positionSize;
            liquidationPrice = entry * (1 - (1 / leverage));
        } else { // SHORT
            pnl = (entry - exit) * positionSize;
            liquidationPrice = entry * (1 + (1 / leverage));
        }
        
        const pnlColor = pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
        
        return {
            initialMargin: `$${initialMargin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            pnl: `${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            pnlColor,
            liquidationPrice: `$${liquidationPrice.toLocaleString('en-US', { minimumFractionDigits: 5, maximumFractionDigits: 8 })}`,
        };
    }, [params.entryPrice, exitPrice, calculatedResults.positionSize, params.leverage, positionType]);

    useEffect(() => {
        if (currentAnalysis) {
            setPositionType(currentAnalysis.tradeSetup.tradeType.toUpperCase() as 'LONG' | 'SHORT');
            if (currentAnalysis.tradeSetup.entryPrice) {
                 setParams(prev => ({ ...prev, entryPrice: currentAnalysis.tradeSetup.entryPrice, stopLoss: Math.abs(parseFloat(currentAnalysis.tradeSetup.entryPrice) - parseFloat(currentAnalysis.tradeSetup.stopLoss)).toString() }));
            }
        }
    }, [currentAnalysis, setParams]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };
    
    // Validasi input
    const inputErrors = {
        accountBalance: '',
        riskPerTrade: '',
        entryPrice: '',
        stopLoss: '',
        riskRewardRatio: '',
        leverage: '',
    };
    const balance = parseLocaleNumber(params.accountBalance);
    if (isNaN(balance) || balance <= 0) inputErrors.accountBalance = 'Enter a valid positive number.';
    const riskPercent = parseLocaleNumber(params.riskPerTrade);
    if (isNaN(riskPercent) || riskPercent <= 0 || riskPercent > 100) inputErrors.riskPerTrade = 'Risk must be between 0 and 100.';
    const entryPrice = parseLocaleNumber(params.entryPrice);
    if (isNaN(entryPrice) || entryPrice <= 0) inputErrors.entryPrice = 'Enter a valid positive number.';
    const stopLossDistance = parseLocaleNumber(params.stopLoss);
    if (isNaN(stopLossDistance) || stopLossDistance <= 0) inputErrors.stopLoss = 'Enter a valid positive number.';
    const riskRewardRatio = parseLocaleNumber(params.riskRewardRatio);
    if (isNaN(riskRewardRatio) || riskRewardRatio <= 0) inputErrors.riskRewardRatio = 'Enter a valid positive number.';
    const leverage = parseLocaleNumber(params.leverage);
    if (isNaN(leverage) || leverage <= 0 || leverage > 125) inputErrors.leverage = 'Leverage must be between 1 and 125.';

    return (
        <div className="p-6">
            <div className="flex items-center mb-4">
                <CalculatorIcon className="h-6 w-6 text-slate-500 dark:text-slate-400 mr-3" />
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Trade Setup & Calculator</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1">Set your risk parameters for trade analysis.</p>
            <a href={timeframeSettings.link} className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-medium mb-6 block">{timeframeSettings.text}</a>

            <div className="space-y-6">
                <div>
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-3">Pre-Trade Risk Setup</h4>
                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Position Type</label>
                            <div className="mt-2 grid grid-cols-2 gap-3">
                                <button onClick={() => setPositionType('LONG')} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${positionType === 'LONG' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Long</button>
                                <button onClick={() => setPositionType('SHORT')} className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${positionType === 'SHORT' ? 'bg-red-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>Short</button>
                            </div>
                         </div>
                        <InputField id="accountBalance" label="Account Balance ($)" value={params.accountBalance} onChange={handleChange} placeholder="e.g., 10000" error={inputErrors.accountBalance} />
                        <InputField id="riskPerTrade" label="Risk Per Trade (%)" value={params.riskPerTrade} onChange={handleChange} placeholder="e.g., 1" error={inputErrors.riskPerTrade} />

                        <InputField id="entryPrice" label="Entry Price" value={params.entryPrice} onChange={handleChange} placeholder="e.g., 30000" error={inputErrors.entryPrice} />
                        <InputField id="stopLoss" label="Stop Loss (Points)" value={params.stopLoss} onChange={handleChange} placeholder="Distance from entry, e.g., 50" error={inputErrors.stopLoss} />
                        <InputField id="riskRewardRatio" label="Risk/Reward Ratio" value={params.riskRewardRatio} onChange={handleChange} placeholder="e.g., 1.5" error={inputErrors.riskRewardRatio} />
                        
                        <div>
                            <label htmlFor="leverage" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Leverage ({params.leverage}x)
                            </label>
                            <input
                                id="leverage"
                                type="range"
                                min="1"
                                max="125"
                                step="1"
                                value={params.leverage}
                                onChange={handleChange}
                                name="leverage"
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 mt-2"
                            />
                            {inputErrors.leverage && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{inputErrors.leverage}</p>}
                        </div>
                    </div>
                </div>
                
                <div className="!mt-8">
                     <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">Calculated Risk Results</h4>
                     <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-1">
                        <ResultField label="Potential Loss" value={calculatedResults.potentialLoss} className="text-red-600 dark:text-red-400" />
                        <ResultField label="Potential Profit" value={calculatedResults.potentialProfit} className="text-emerald-600 dark:text-emerald-400" />
                        <ResultField label="Take Profit Price" value={calculatedResults.takeProfitPrice} />
                        <ResultField label="Position Size (Units)" value={calculatedResults.positionSize} />
                        <ResultField label="Margin Required" value={calculatedResults.marginRequired} />
                     </div>
                </div>

                <div className="!mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-3">P/L & Liquidation Calculator</h4>
                    <div className="space-y-4">
                         <InputField id="exitPrice" label="Current / Exit Price" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="e.g., 31000" type="number" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-1 mt-4">
                        <ResultField label="Initial Margin" value={pnlResults.initialMargin} />
                        <ResultField label="Profit / Loss (P/L)" value={pnlResults.pnl} className={pnlResults.pnlColor} />
                        <ResultField label="Liquidation Price" value={pnlResults.liquidationPrice} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TradeSetupCalculator;