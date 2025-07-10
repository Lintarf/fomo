import React, { useState, useEffect } from 'react';
import { SettingsIcon, SpinnerIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import * as supabaseService from '../services/supabaseService';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '../services/supabaseService';
import { ApiStatus } from '../types';

interface SettingsProps {
    initialCapital: number;
    supabaseClient: SupabaseClient<Database> | null;
    user: User | null;
    userProfile: Database['public']['Tables']['users']['Row'] | null;
    geminiApiKey: string;
    apiStatus: ApiStatus;
    onApiKeyUpdate: (key: string) => Promise<void>;
    onCapitalUpdate: (newCapital: number) => void;
    onProfileUpdate: (profileData: { name: string; description: string }) => void;
    onWithdraw: (amount: number) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ 
    initialCapital, 
    supabaseClient,
    user,
    userProfile,
    geminiApiKey,
    apiStatus,
    onApiKeyUpdate,
    onCapitalUpdate,
    onProfileUpdate,
    onWithdraw,
}) => {
    const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey);
    const [isSavingApi, setIsSavingApi] = useState(false);
    const [apiMessage, setApiMessage] = useState('');
    const [apiMessageIsError, setApiMessageIsError] = useState(false);

    const [capitalInput, setCapitalInput] = useState(String(initialCapital));
    const [isSavingCapital, setIsSavingCapital] = useState(false);
    const [capitalMessage, setCapitalMessage] = useState('');
    const [capitalMessageIsError, setCapitalMessageIsError] = useState(false);

    const [withdrawalAmount, setWithdrawalAmount] = useState('');
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [withdrawalMessage, setWithdrawalMessage] = useState('');
    const [withdrawalMessageIsError, setWithdrawalMessageIsError] = useState(false);
    
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState('');
    const [profileMessageIsError, setProfileMessageIsError] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setName(userProfile.nama || '');
            setDescription(userProfile.describe || '');
        }
    }, [userProfile]);

    useEffect(() => { setCapitalInput(String(initialCapital)); }, [initialCapital]);
    useEffect(() => { setApiKeyInput(geminiApiKey); }, [geminiApiKey]);

    const handleApiKeySave = async () => {
        setIsSavingApi(true);
        setApiMessage('');
        setApiMessageIsError(false);

        if (!apiKeyInput.trim()) {
            setApiMessage('API Key cannot be empty.');
            setApiMessageIsError(true);
            setIsSavingApi(false);
            setTimeout(() => setApiMessage(''), 5000);
            return;
        }

        try {
            await onApiKeyUpdate(apiKeyInput);
            setApiMessage('API Key updated and verified successfully!');
            setApiMessageIsError(false);
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save or verify API key.";
            setApiMessage(errorMessage);
            setApiMessageIsError(true);
        } finally {
            setIsSavingApi(false);
            setTimeout(() => setApiMessage(''), 5000);
        }
    };
    
    const handleCapitalSave = async () => {
        setIsSavingCapital(true);
        setCapitalMessage('');
        setCapitalMessageIsError(false);

        if (!supabaseClient || !user) {
            setCapitalMessage("You must be logged in to save settings.");
            setCapitalMessageIsError(true);
            setIsSavingCapital(false);
            return;
        }
        const newCapital = Number(capitalInput);
        if(isNaN(newCapital) || newCapital < 0) {
            setCapitalMessage('Please enter a valid positive number.');
            setCapitalMessageIsError(true);
            setIsSavingCapital(false);
            return;
        }

        try {
            await supabaseService.updateUserInitialCapital(supabaseClient, user.id, newCapital);
            onCapitalUpdate(newCapital);
            setCapitalMessage('Base capital updated successfully!');
            setCapitalMessageIsError(false);
            setTimeout(() => setCapitalMessage(''), 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save capital to the database.";
            setCapitalMessage(errorMessage);
            setCapitalMessageIsError(true);
        } finally {
            setIsSavingCapital(false);
        }
    };

    const handleWithdrawalAction = async () => {
        setIsWithdrawing(true);
        setWithdrawalMessage('');
        setWithdrawalMessageIsError(false);

        const amount = Number(withdrawalAmount);
        if (isNaN(amount) || amount <= 0) {
            setWithdrawalMessage('Please enter a valid positive withdrawal amount.');
            setWithdrawalMessageIsError(true);
            setIsWithdrawing(false);
            return;
        }

        if (amount > initialCapital) {
            setWithdrawalMessage('Withdrawal amount cannot exceed your current capital.');
            setWithdrawalMessageIsError(true);
            setIsWithdrawing(false);
            return;
        }
        
        try {
            await onWithdraw(amount);
            setWithdrawalMessage('Withdrawal successful!');
            setWithdrawalMessageIsError(false);
            setWithdrawalAmount('');
            setTimeout(() => setWithdrawalMessage(''), 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to process withdrawal.";
            setWithdrawalMessage(errorMessage);
            setWithdrawalMessageIsError(true);
        } finally {
            setIsWithdrawing(false);
        }
    };

    const handleProfileSave = async () => {
        setIsSavingProfile(true);
        setProfileMessage('');
        setProfileMessageIsError(false);

        if (!supabaseClient || !user) {
            setProfileMessage("You must be logged in to save settings.");
            setProfileMessageIsError(true);
            setIsSavingProfile(false);
            return;
        }
        if (name.trim().length < 2) {
            setProfileMessage('Name must be at least 2 characters.');
            setProfileMessageIsError(true);
            setIsSavingProfile(false);
            return;
        }
        if (description.length > 200) {
            setProfileMessage('Description cannot exceed 200 characters.');
            setProfileMessageIsError(true);
            setIsSavingProfile(false);
            return;
        }
        try {
            await supabaseService.updateUserProfile(supabaseClient, user.id, name, description);
            onProfileUpdate({ name, description });
            setProfileMessage('Profile updated successfully!');
            setProfileMessageIsError(false);
            setTimeout(() => setProfileMessage(''), 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save profile to the database.";
            setProfileMessage(errorMessage);
            setProfileMessageIsError(true);
        } finally {
            setIsSavingProfile(false);
        }
    };
    
    return (
        <div className="flex-1 flex flex-col gap-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your application settings and profile.</p>
            </header>

            <main className="space-y-8">
                <section className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-opacity ${(!supabaseClient || !user) && 'opacity-50'}`}>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Profile Settings</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Update your public profile information. This may be used in the future for leaderboards or community features.
                    </p>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label htmlFor="profileName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    id="profileName"
                                    className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Name"
                                    disabled={!supabaseClient || !user || isSavingProfile}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="profileDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                            <div className="mt-1">
                                <textarea
                                    id="profileDescription"
                                    rows={3}
                                    className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="A short bio about your trading style"
                                    disabled={!supabaseClient || !user || isSavingProfile}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <button
                                onClick={handleProfileSave}
                                disabled={!supabaseClient || !user || isSavingProfile}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isSavingProfile ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Save Profile'}
                            </button>
                            <div className="h-5 mt-2">
                                {profileMessage && (
                                    <div className={`flex items-center gap-2 text-sm ${profileMessageIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {profileMessageIsError ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                        <span className="font-medium whitespace-pre-wrap">{profileMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                
                 <section className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-opacity ${(!supabaseClient || !user) && 'opacity-50'}`}>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">AI Engine (Google Gemini)</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        Enter your Google Gemini API key to enable all AI-powered analysis features. Your key is stored securely in the database.
                    </p>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">API Key</label>
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="password"
                                    id="apiKey"
                                    className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="Enter your Gemini API Key"
                                    disabled={!supabaseClient || !user || isSavingApi}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <button
                                onClick={handleApiKeySave}
                                disabled={!supabaseClient || !user || isSavingApi || apiStatus === 'verifying'}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {(isSavingApi || apiStatus === 'verifying') ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Save & Verify Key'}
                            </button>
                            <div className="h-5 mt-2">
                                {apiMessage && (
                                    <div className={`flex items-center gap-2 text-sm ${apiMessageIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {apiMessageIsError ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                        <span className="font-medium whitespace-pre-wrap">{apiMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className={`bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 transition-opacity ${(!supabaseClient || !user) && 'opacity-50'}`}>
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Financial Settings</h2>
                    <div className="max-w-xl">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                           Set your base capital balance. This value is the foundation for all performance calculations and should only be changed to reflect deposits or withdrawals.
                        </p>
                         <div>
                            <label htmlFor="initialCapital" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Base Capital ($)
                            </label>
                            <input
                                type="number"
                                id="initialCapital"
                                disabled={!supabaseClient || !user || isSavingCapital}
                                className="shadow-sm disabled:opacity-50 focus:ring-violet-500 focus:border-violet-500 block w-full text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                                value={capitalInput}
                                onChange={(e) => setCapitalInput(e.target.value)}
                            />
                        </div>
                        <div className="mt-4 flex flex-col">
                             <button
                                onClick={handleCapitalSave}
                                disabled={!supabaseClient || !user || isSavingCapital}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isSavingCapital ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Set Base Capital'}
                            </button>
                             <div className="h-5 mt-2">
                                {capitalMessage && (
                                    <div className={`flex items-center gap-2 text-sm ${capitalMessageIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {capitalMessageIsError ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                        <span className="font-medium whitespace-pre-wrap">{capitalMessage}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-100 mb-2">Withdraw Funds</h3>
                             <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                                Enter an amount to withdraw from your base capital. This will permanently reduce it.
                            </p>
                             <div>
                                <label htmlFor="withdrawalAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Withdrawal Amount ($)
                                </label>
                                <input
                                    type="number"
                                    id="withdrawalAmount"
                                    placeholder="0.00"
                                    disabled={!supabaseClient || !user || isWithdrawing}
                                    className="shadow-sm disabled:opacity-50 focus:ring-violet-500 focus:border-violet-500 block w-full text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                                />
                            </div>
                             <div className="mt-4 flex flex-col">
                                <button
                                    onClick={handleWithdrawalAction}
                                    disabled={!supabaseClient || !user || isWithdrawing || !withdrawalAmount}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                >
                                    {isWithdrawing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Withdraw'}
                                </button>
                                <div className="h-5 mt-2">
                                    {withdrawalMessage && (
                                        <div className={`flex items-center gap-2 text-sm ${withdrawalMessageIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {withdrawalMessageIsError ? <XCircleIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                            <span className="font-medium whitespace-pre-wrap">{withdrawalMessage}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
                
            </main>
        </div>
    );
};