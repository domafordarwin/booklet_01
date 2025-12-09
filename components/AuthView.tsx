import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { UserProfile } from '../types';
import * as StorageService from '../services/storageService';
import { Loader2, BrainCircuit, LogOut, WifiOff, ArrowRight } from './Icons';

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
    const [forceOffline, setForceOffline] = useState(false);

    const isDemoMode = (!supabase || forceOffline);

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
                
                // Fetch or Create Profile with Fallback
                try {
                    const profile = await StorageService.getUserProfile();
                    if (profile) {
                        onAuthSuccess(profile);
                    } else {
                        // Create new profile for existing auth user (first time login scenario)
                        const newProfile: UserProfile = { name: email.split('@')[0], joinedAt: Date.now() };
                        await StorageService.saveUserProfile(newProfile);
                        onAuthSuccess(newProfile);
                    }
                } catch (dbError: any) {
                    console.warn("Database error after auth, switching to offline:", dbError);
                    // Critical Fallback: Auth worked, but DB failed (missing tables?).
                    // Switch to offline mode seamlessly so user gets in.
                    StorageService.enableOfflineMode();
                    const offlineProfile: UserProfile = { name: email.split('@')[0], joinedAt: Date.now() };
                    await StorageService.saveUserProfile(offlineProfile);
                    onAuthSuccess(offlineProfile);
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
                    
                    try {
                        await StorageService.saveUserProfile(newProfile);
                        onAuthSuccess(newProfile);
                    } catch (dbError) {
                        // Fallback same as login
                        StorageService.enableOfflineMode();
                        await StorageService.saveUserProfile(newProfile);
                        onAuthSuccess(newProfile);
                    }
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

    const handleSwitchToOffline = () => {
        StorageService.enableOfflineMode();
        setForceOffline(true);
        setError(null);
        // If we switch to offline, we can auto-login as guest or show the guest form
        // Let's reset form state to be guest-friendly
        setIsLogin(true);
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] p-8 items-center justify-center">
            <div className="w-full max-w-sm flex flex-col h-full justify-center">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">BookTalk</h1>
                    <p className="text-stone-500 mb-4 font-serif italic">Your reading archive.</p>
                    
                    {isDemoMode && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-stone-800 text-stone-100 text-xs font-bold shadow-sm animate-in fade-in">
                            <WifiOff size={12} className="mr-2" />
                            Offline Mode Active
                        </div>
                    )}
                </div>

                <form onSubmit={handleAuth} className="space-y-5">
                    {error && (
                        <div className={`p-4 rounded-xl text-sm text-center font-medium animate-in slide-in-from-top-2 shadow-sm border ${error.includes('Switching') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {error}
                        </div>
                    )}

                    {(!isLogin || isDemoMode) && (
                        <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                Name
                            </label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-base font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all shadow-sm"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                            {isDemoMode ? 'Email (Optional)' : 'Email'}
                        </label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="hello@example.com"
                            className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-base font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all shadow-sm"
                            required={!isDemoMode}
                        />
                    </div>

                    {!isDemoMode && (
                        <div>
                            <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-base font-serif text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all shadow-sm"
                                required
                            />
                        </div>
                    )}

                    <div className="pt-2 space-y-3">
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-base shadow-md transition-all active:scale-95 flex items-center justify-center
                                ${loading ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800'}
                            `}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : (isDemoMode ? 'Start Demo' : (isLogin ? 'Log In' : 'Create Account'))}
                        </button>

                        {!isDemoMode && (
                            <button 
                                type="button"
                                onClick={handleSwitchToOffline}
                                className="w-full py-4 rounded-xl font-bold text-base text-stone-600 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                <BrainCircuit size={18} className="text-amber-600" />
                                Continue Offline (Demo)
                            </button>
                        )}
                    </div>
                </form>

                {!isDemoMode && (
                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="text-stone-400 hover:text-stone-800 text-sm font-medium transition-colors"
                        >
                            {isLogin ? "First time? Create an account" : "Already have an account? Log In"}
                        </button>
                    </div>
                )}
                
                {(!supabase) && !forceOffline && (
                     <p className="mt-6 text-xs text-center text-stone-400 max-w-[200px] mx-auto leading-relaxed">
                        Supabase keys not found. Data will persist locally.
                     </p>
                )}
            </div>
        </div>
    );
};