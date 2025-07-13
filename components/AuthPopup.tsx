import React, { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, signInWithPassword, signUpUser } from '../services/supabaseService';
import { XCircleIcon, SpinnerIcon } from './Icons';

interface AuthPopupProps {
  supabaseClient: SupabaseClient<Database>;
  open: boolean;
  onClose: () => void;
}

const AuthPopup: React.FC<AuthPopupProps> = ({ supabaseClient, open, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  
  useEffect(() => {
      const savedEmail = localStorage.getItem('rememberedEmail');
      if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
      } else {
          setRememberMe(false);
      }
  }, []);

  const validateEmail = (email: string) => {
    // Simple email regex
    return /^\S+@\S+\.\S+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validasi sebelum submit
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }
    if (mode === 'register' && nama.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        await signInWithPassword(supabaseClient, { email, password });
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        // Close popup immediately after successful login
        onClose();
      } else {
        await signUpUser(supabaseClient, { email, password, nama });
        // Close popup immediately after successful registration
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    // Do not clear email when toggling, user might want to register with remembered email
    setPassword('');
    setNama('');
  };

  // Don't render if not open
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-md w-full transform transition-all scale-100 opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          aria-label="Close"
        >
          <XCircleIcon className="w-8 h-8" />
        </button>

        <div>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-slate-100">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1">
            {mode === 'login' ? 'Sign in to continue' : 'Get started with FOMO AI'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {mode === 'register' && (
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="nama"
                  name="nama"
                  type="text"
                  autoComplete="name"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:focus:ring-violet-500"
                />
              </div>
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:focus:ring-violet-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password-auth" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password-auth"
                name="password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-violet-600 sm:text-sm sm:leading-6 bg-white dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600 dark:focus:ring-violet-500"
              />
            </div>
          </div>

          {mode === 'login' && (
             <div className="flex items-center">
                <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-600 dark:bg-slate-700 dark:border-slate-600 dark:focus:ring-violet-500 dark:ring-offset-slate-800"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900 dark:text-slate-300">
                    Remember me
                </label>
            </div>
          )}


          {error && <p className="text-sm text-red-600 dark:text-red-400 text-center whitespace-pre-wrap">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:bg-slate-400 disabled:cursor-wait"
            >
              {loading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : (mode === 'login' ? 'Sign in' : 'Register')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            <button onClick={toggleMode} className="font-medium text-violet-600 hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300 ml-1">
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;