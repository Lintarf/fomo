import React, { useEffect } from 'react';
import { AlertTriangleIcon, SpinnerIcon, InfoIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const confirmButtonClasses = isDestructive
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500';
    
  const iconContainerClasses = isDestructive
    ? 'bg-red-100 dark:bg-red-900/50'
    : 'bg-violet-100 dark:bg-violet-900/50';

  const icon = isDestructive ? (
    <AlertTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
  ) : (
    <InfoIcon className="h-6 w-6 text-violet-600 dark:text-violet-400" />
  );


  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center transform transition-all scale-100 opacity-100" onClick={(e) => e.stopPropagation()}>
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconContainerClasses}`}>
            {icon}
        </div>
        <h3 className="mt-5 text-lg font-semibold leading-6 text-slate-900 dark:text-slate-100">{title}</h3>
        <div className="mt-2">
            <div className="text-sm text-slate-500 dark:text-slate-400">{message}</div>
        </div>
        <div className="mt-6 flex flex-col sm:flex-row-reverse gap-3">
             <button
                type="button"
                className={`w-full inline-flex justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:bg-slate-400 ${confirmButtonClasses}`}
                onClick={onConfirm}
                disabled={isLoading}
             >
                {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : confirmText}
            </button>
             <button
                type="button"
                className="w-full inline-flex justify-center rounded-md bg-white dark:bg-slate-700 px-3 py-2 text-sm font-semibold text-slate-900 dark:text-slate-200 shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50"
                onClick={onClose}
                disabled={isLoading}
            >
                {cancelText}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;