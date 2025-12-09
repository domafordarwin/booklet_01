import React from 'react';
import { UserProfile, Book, ReadingStatus } from '../types';
import { User, LogOut } from './Icons';
import { supabase } from '../services/supabaseClient';

interface ProfileViewProps {
  profile: UserProfile;
  books: Book[];
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, books, onLogout }) => {
  const readingCount = books.filter(b => b.status === ReadingStatus.READING).length;
  const completedCount = books.filter(b => b.status === ReadingStatus.COMPLETED).length;
  const totalReviews = books.reduce((acc, book) => acc + (book.rating > 0 ? 1 : 0), 0);
  const isCloud = !!supabase;

  const handleSignOut = async () => {
      if (isCloud) {
          await supabase!.auth.signOut();
      } else {
          localStorage.removeItem('booktalk_user_session');
      }
      onLogout();
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 bg-white shadow-sm z-10 flex justify-between items-center">
         <div>
            <h1 className="text-2xl font-serif font-bold text-stone-900">My Account</h1>
            <p className="text-stone-500 text-sm mt-1">Reader Profile</p>
         </div>
         <button onClick={handleSignOut} className="text-red-400 hover:text-red-600 p-2" title="Log Out">
            <LogOut size={20} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Profile Card */}
        <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center text-stone-400 border-4 border-white shadow-md">
                <User size={40} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-stone-900 font-serif">{profile.name}</h2>
                <p className="text-xs text-stone-500">Joined {new Date(profile.joinedAt).toLocaleDateString()}</p>
                <div className={`mt-2 inline-flex items-center px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${isCloud ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-600'}`}>
                    {isCloud ? 'Cloud Synced' : 'Local Storage'}
                </div>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-stone-800 font-serif">{books.length}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Books</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-amber-600 font-serif">{completedCount}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Finished</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-stone-800 font-serif">{totalReviews}</span>
                <span className="text-[10px] text-stone-400 uppercase tracking-wide mt-1">Reviews</span>
            </div>
        </div>

        {/* Info */}
        <div className="bg-amber-50/50 p-6 rounded-xl border border-amber-100/50 text-center">
            <p className="text-sm text-stone-600 leading-relaxed font-serif italic">
                "A room without books is like a body without a soul."
            </p>
            <p className="text-xs text-stone-400 mt-2">- Marcus Tullius Cicero</p>
        </div>
        
        {!isCloud && (
            <div className="text-center text-xs text-stone-400">
                <p>You are using Demo Mode.</p>
                <p>Connect Supabase to sync across devices.</p>
            </div>
        )}

      </div>
    </div>
  );
};