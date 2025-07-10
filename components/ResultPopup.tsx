import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from './Icons';

interface ResultPopupProps {
  type: 'profit' | 'stop-loss';
  onSave: (amount: number) => void;
  onClose: () => void;
}

const ResultPopup: React.FC<ResultPopupProps> = ({ type, onSave, onClose }) => {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Replace comma with a dot for international users
    const sanitizedValue = value.replace(/,/g, '.');

    // This regex ensures that the value is a valid decimal number format.
    // It allows an empty string, a number, a number followed by a dot, or a number with a decimal part.
    if (/^\d*\.?\d*$/.test(sanitizedValue)) {
      setAmount(sanitizedValue);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // parseFloat will handle values like "1." or ".5" correctly
      const numericAmount = parseFloat(amount);
      if (!isNaN(numericAmount) && numericAmount > 0) {
          onSave(numericAmount);
      }
  }

  const isProfit = type === 'profit';
  const isValidAmount = !isNaN(parseFloat(amount)) && parseFloat(amount) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center transform transition-all scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
            {isProfit ? (
              <CheckCircleIcon className="mx-auto h-16 w-16 text-emerald-500" />
            ) : (
              <XCircleIcon className="mx-auto h-16 w-16 text-red-500" />
            )}
            <h2 className={`mt-4 text-2xl font-bold ${isProfit ? 'text-emerald-800 dark:text-emerald-300' : 'text-red-800 dark:text-red-300'}`}>
              {isProfit ? 'Record Profit' : "Record Stop Loss"}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
                {isProfit ? 'Enter the final profit amount for this trade.' : 'Enter the final loss amount for this trade.'}
            </p>

            <div className="mt-6">
                <label htmlFor="amount" className="sr-only">
                    {isProfit ? 'Profit Amount' : 'Loss Amount'}
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="text"
                        inputMode="decimal"
                        name="amount"
                        id="amount"
                        className="block w-full rounded-md border-0 py-2.5 pl-7 pr-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:focus:ring-violet-500"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        required
                        autoFocus
                    />
                </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full px-4 py-2 rounded-lg font-semibold text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-violet-500 disabled:bg-slate-400"
              disabled={!isValidAmount}
            >
              Save Result
            </button>
        </form>
      </div>
    </div>
  );
};

export default ResultPopup;