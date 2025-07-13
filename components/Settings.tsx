import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import * as supabaseService from '../services/supabaseService';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '../services/supabaseService';
import { ApiStatus } from '../types';

interface SettingsProps {
    user: User;
    apiKey: string;
    apiStatus: ApiStatus;
    onApiKeyUpdate: (key: string) => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({ 
    user,
    apiKey,
    apiStatus,
    onApiKeyUpdate,
}) => {
    // Profile
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [profileMsg, setProfileMsg] = useState('');
    const [profileMsgIsError, setProfileMsgIsError] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    // Financial
    const [initialCapital, setInitialCapital] = useState('');
    const [financialMsg, setFinancialMsg] = useState('');
    const [financialMsgIsError, setFinancialMsgIsError] = useState(false);
    const [isSavingFinancial, setIsSavingFinancial] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMsg, setWithdrawMsg] = useState('');
    const [withdrawMsgIsError, setWithdrawMsgIsError] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    // API
    const [apiKeyInput, setApiKeyInput] = useState(apiKey);
    const [isSavingApi, setIsSavingApi] = useState(false);
    const [apiMessage, setApiMessage] = useState('');
    const [apiMessageIsError, setApiMessageIsError] = useState(false);

    useEffect(() => { setApiKeyInput(apiKey); }, [apiKey]);

    // Load profile and financial data from Supabase
    useEffect(() => {
        const fetchProfile = async () => {
            const client = supabaseService.supabase;
            if (!client || !user) return;
            const profile = await supabaseService.getUserProfile(client, user.id);
            if (profile) {
                setName(profile.nama || '');
                setDescription(profile.describe || '');
                setInitialCapital(profile.initial_trade !== null && profile.initial_trade !== undefined ? String(profile.initial_trade) : '');
            }
        };
        fetchProfile();
    }, [user]);

    // Profile save
    const handleProfileSave = async () => {
        setIsSavingProfile(true);
        setProfileMsg('');
        setProfileMsgIsError(false);
        try {
            const client = supabaseService.supabase;
            await supabaseService.updateUserProfile(client, user.id, name, description);
            setProfileMsg('Profile updated successfully!');
        } catch (err) {
            setProfileMsg('Failed to update profile.');
            setProfileMsgIsError(true);
        } finally {
            setIsSavingProfile(false);
            setTimeout(() => setProfileMsg(''), 5000);
        }
    };

    // Financial save
    const handleFinancialSave = async () => {
        setIsSavingFinancial(true);
        setFinancialMsg('');
        setFinancialMsgIsError(false);
        try {
            const client = supabaseService.supabase;
            await supabaseService.updateUserInitialCapital(client, user.id, Number(initialCapital));
            setFinancialMsg('Base capital updated successfully!');
        } catch (err) {
            setFinancialMsg('Failed to update base capital.');
            setFinancialMsgIsError(true);
        } finally {
            setIsSavingFinancial(false);
            setTimeout(() => setFinancialMsg(''), 5000);
        }
    };

    // Withdraw
    const handleWithdraw = async () => {
        setIsWithdrawing(true);
        setWithdrawMsg('');
        setWithdrawMsgIsError(false);
        try {
            const client = supabaseService.supabase;
            const newCapital = Number(initialCapital) - Number(withdrawAmount);
            if (newCapital < 0) throw new Error('Insufficient funds.');
            await supabaseService.updateUserInitialCapital(client, user.id, newCapital);
            setInitialCapital(String(newCapital));
            setWithdrawMsg('Withdrawal successful!');
        } catch (err) {
            setWithdrawMsg('Failed to withdraw funds.');
            setWithdrawMsgIsError(true);
        } finally {
            setIsWithdrawing(false);
            setTimeout(() => setWithdrawMsg(''), 5000);
        }
    };

    // API Key save (existing)
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

    return (
        <div className="flex-1 flex flex-col gap-6 pt-8 md:pt-12 px-4 md:px-8 pb-8 w-full">
            <header>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Settings</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your application settings and profile.</p>
            </header>
            <main className="space-y-8">
                {/* Profile Settings */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Profile Settings</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Update your profile information. This may be used in the future for leaderboards or community features.</p>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                            <input
                                id="name"
                                type="text"
                                className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={isSavingProfile}
                            />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                            <textarea
                                id="description"
                                className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                disabled={isSavingProfile}
                                rows={2}
                            />
                        </div>
                        <button
                            onClick={handleProfileSave}
                            disabled={isSavingProfile}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isSavingProfile ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Save Profile'}
                        </button>
                        <div className="h-5 mt-2">
                            {profileMsg && (
                                <div className={`flex items-center gap-2 text-sm ${profileMsgIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {profileMsgIsError ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                    {profileMsg}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                {/* API Key Settings */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">GPT-4o API Key</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Masukkan API Key GPT-4o dari Sumo Pod untuk mengaktifkan analisis chart AI dan insight performa.</p>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 dark:text-slate-300">GPT-4o API Key</label>
                            <div className="mt-1">
                                <input
                                    type="password"
                                    id="apiKey"
                                    className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                    value={apiKeyInput}
                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                    placeholder="Enter your GPT-4o API key"
                                    disabled={isSavingApi}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <button
                                onClick={handleApiKeySave}
                                disabled={isSavingApi}
                                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isSavingApi ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Save & Verify Key'}
                            </button>
                            <div className="h-5 mt-2">
                                {apiMessage && (
                                    <div className={`flex items-center gap-2 text-sm ${apiMessageIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {apiMessageIsError ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                        {apiMessage}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
                {/* Financial Settings */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Financial Settings</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Set your base capital. This value is the foundation for all performance calculations and withdrawals.</p>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label htmlFor="initialCapital" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Base Capital ($)</label>
                            <input
                                id="initialCapital"
                                type="number"
                                className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                value={initialCapital}
                                onChange={e => setInitialCapital(e.target.value)}
                                disabled={isSavingFinancial}
                                min={0}
                            />
                        </div>
                        <button
                            onClick={handleFinancialSave}
                            disabled={isSavingFinancial}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isSavingFinancial ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Set Base Capital'}
                        </button>
                        <div className="h-5 mt-2">
                            {financialMsg && (
                                <div className={`flex items-center gap-2 text-sm ${financialMsgIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {financialMsgIsError ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                    {financialMsg}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                {/* Withdraw Funds */}
                <section className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">Withdraw Funds</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Enter an amount to withdraw from your base capital. This will permanently reduce it.</p>
                    <div className="space-y-4 max-w-xl">
                        <div>
                            <label htmlFor="withdrawAmount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Withdraw Amount ($)</label>
                            <input
                                id="withdrawAmount"
                                type="number"
                                className="flex-grow shadow-sm focus:ring-violet-500 focus:border-violet-500 block w-full sm:text-sm border-slate-300 rounded-md bg-slate-50 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 disabled:opacity-50"
                                value={withdrawAmount}
                                onChange={e => setWithdrawAmount(e.target.value)}
                                disabled={isWithdrawing}
                                min={0}
                            />
                        </div>
                        <button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:ring-violet-500 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed"
                        >
                            {isWithdrawing ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Withdraw'}
                        </button>
                        <div className="h-5 mt-2">
                            {withdrawMsg && (
                                <div className={`flex items-center gap-2 text-sm ${withdrawMsgIsError ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {withdrawMsgIsError ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                                    {withdrawMsg}
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Settings;