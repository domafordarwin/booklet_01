import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';
import * as StorageService from '../services/storageService';
import { Loader2, BrainCircuit } from './Icons';

interface AuthViewProps {
    onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isDemoMode = !supabase;

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isDemoMode) {
                // Mock Login for Demo Mode
                await new Promise(resolve => setTimeout(resolve, 800)); // Fake delay
                const newProfile: UserProfile = { 
                    name: name || email.split('@')[0] || 'Demo User', 
                    joinedAt: Date.now() 
                };
                await StorageService.saveUserProfile(newProfile);
                onAuthSuccess(newProfile);
                return;
            }

            if (isLogin) {
                // Supabase Login
                const { data, error } = await supabase!.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                
                // Fetch profile
                const profile = await StorageService.getUserProfile();
                if (profile) {
                    onAuthSuccess(profile);
                } else {
                    const newProfile: UserProfile = { name: email.split('@')[0], joinedAt: Date.now() };
                    await StorageService.saveUserProfile(newProfile);
                    onAuthSuccess(newProfile);
                }

            } else {
                // Supabase Sign Up
                const { data, error } = await supabase!.auth.signUp({
                    email,
                    password,
                });
                
                if (error) throw error;

                if (data.user) {
                    const newProfile: UserProfile = {
                        name: name || email.split('@')[0],
                        joinedAt: Date.now()
                    };
                    await StorageService.saveUserProfile(newProfile);
                    onAuthSuccess(newProfile);
                }
            }
        } catch (err: any) {
            console.error("Auth error:", err);
            let msg = err.message || 'An error occurred';
            
            // User-friendly error mapping
            if (msg.includes('User already registered')) {
                msg = "This account already exists. Switching to Log In...";
                setTimeout(() => {
                    setIsLogin(true);
                    setError(null);
                }, 1500);
            } else if (msg.includes('Invalid login credentials')) {
                msg = "Incorrect email or password.";
            }

            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] p-8 items-center justify-center">
            <div className="w-full max-w-sm">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">BookTalk</h1>
                    <p className="text-stone-500 mb-4">Your reading archive.</p>
                    
                    {isDemoMode && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                            <BrainCircuit size={12} className="mr-1" />
                            Demo Mode (Local Storage)
                        </div>
                    )}
                </div>

                <form onSubmit={handleAuth} className="space-y-6">
                    {error && (
                        <div className={`p-3 rounded-lg text-sm text-center font-medium animate-in slide-in-from-top-2 ${error.includes('Switching') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            {error}
                        </div>
                    )}

                    {(!isLogin || isDemoMode) && (
                        <div>
                            <label className="block text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">
                                Name (Nickname)
                            </label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full bg-white border-b-2 border-stone-200 py-3 text-lg font-serif text-stone-900 focus:outline-none focus:border-amber-500 placeholder-stone-200 transition-colors"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">
                            {isDemoMode ? 'Email (Optional)' : 'Email'}
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="hello@example.com"
                            className="w-full bg-white border-b-2 border-stone-200 py-3 text-lg font-serif text-stone-900 focus:outline-none focus:border-amber-500 placeholder-stone-200 transition-colors"
                            required={!isDemoMode}
                        />
                    </div>

                    {!isDemoMode && (
                        <div>
                            <label className="block text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white border-b-2 border-stone-200 py-3 text-lg font-serif text-stone-900 focus:outline-none focus:border-amber-500 placeholder-stone-200 transition-colors"
                                required
                            />
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center
                            ${loading ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800'}
                        `}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (isDemoMode ? 'Start Demo' : (isLogin ? 'Log In' : 'Sign Up'))}
                    </button>
                </form>

                {!isDemoMode && (
                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-stone-500 hover:text-stone-800 text-sm font-medium underline decoration-stone-300 underline-offset-4"
                        >
                            {isLogin ? "New here? Create an account" : "Already have an account? Log In"}
                        </button>
                    </div>
                )}
                
                {isDemoMode && (
                     <p className="mt-6 text-xs text-center text-stone-400 max-w-[200px] mx-auto leading-relaxed">
                        Supabase keys not found. Running in local demo mode. Data will persist in browser only.
                     </p>
                )}
            </div>
        </div>
    );
};