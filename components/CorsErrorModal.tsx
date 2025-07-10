import React from 'react';
import { DatabaseIcon, RefreshIcon } from './Icons';

const CorsErrorModal: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-80 flex items-center justify-center z-[100] p-4 text-slate-100">
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full p-8">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500/50">
                    <DatabaseIcon className="h-8 w-8 text-red-400" />
                </div>
                <div className="text-center">
                    <h2 className="mt-6 text-2xl font-bold">Database Connection Error</h2>
                    <p className="mt-2 text-slate-300">
                        The application cannot connect to the Supabase database.
                    </p>
                </div>

                <div className="mt-6 text-left bg-slate-900/70 p-6 rounded-lg border border-slate-700 space-y-4">
                    <h3 className="font-semibold text-lg text-yellow-300">This is a CORS Configuration Issue</h3>
                    <p className="text-sm text-slate-400">
                        For security, browsers block requests from this web app to the database server unless the server explicitly allows it. You need to add this app's URL to your Supabase project's list of approved origins.
                    </p>
                    <div>
                        <h4 className="font-semibold text-slate-200 mb-2">How to Fix It:</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-slate-300">
                            <li><span className="font-semibold">Copy this app's URL</span> from your browser's address bar.</li>
                            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">Supabase Dashboard</a>.</li>
                            <li>Navigate to: <code className="text-xs bg-slate-700 px-1.5 py-1 rounded">Project Settings &gt; API</code>.</li>
                            <li>Find the <code className="text-xs bg-slate-700 px-1.5 py-1 rounded">CORS Configuration</code> section.</li>
                            <li>Add your app's URL as a new origin pattern (e.g., <code className="text-xs bg-slate-700 px-1.5 py-1 rounded">http://localhost:3000</code> or your deployment URL).</li>
                            <li>Click <span className="font-semibold">Save</span> in Supabase.</li>
                        </ol>
                    </div>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-violet-500"
                >
                    <RefreshIcon className="w-5 h-5" />
                    I've updated my CORS settings, Refresh Page
                </button>
            </div>
        </div>
    );
};

export default CorsErrorModal;
