import React, { useRef } from 'react';
import { UserProfile, Book, ReadingStatus } from '../types';
import { Download, Upload, Book as BookIcon, Star, CheckCircle2, User } from './Icons';

interface ProfileViewProps {
  profile: UserProfile;
  books: Book[];
  onExportData: () => void;
  onImportData: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ profile, books, onExportData, onImportData }) => {
  const readingCount = books.filter(b => b.status === ReadingStatus.READING).length;
  const completedCount = books.filter(b => b.status === ReadingStatus.COMPLETED).length;
  const totalReviews = books.reduce((acc, book) => acc + (book.rating > 0 ? 1 : 0), 0);

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]">
      {/* Header */}
      <div className="p-6 border-b border-stone-100 bg-white shadow-sm z-10">
         <h1 className="text-2xl font-serif font-bold text-stone-900">My Account</h1>
         <p className="text-stone-500 text-sm mt-1">Reader Profile & Data</p>
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
                <div className="mt-2 inline-flex items-center px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    Avid Reader
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

        {/* Sync / Data Management */}
        <section>
            <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Download size={14} /> Data Synchronization
            </h3>
            
            <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-stone-50 border-b border-stone-100">
                    <p className="text-xs text-stone-500 leading-relaxed">
                        Your library is currently stored on this device. To move your data to another phone or computer, use the buttons below.
                    </p>
                </div>
                <div className="grid grid-cols-1 divide-y divide-stone-100">
                    <button 
                        onClick={onExportData}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition active:bg-stone-100 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Download size={18} />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-bold text-stone-800">Backup Data</span>
                                <span className="block text-[10px] text-stone-400">Save a file to your device</span>
                            </div>
                        </div>
                    </button>

                    <button 
                        onClick={onImportData}
                        className="flex items-center justify-between p-4 hover:bg-stone-50 transition active:bg-stone-100 group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-100 text-stone-600 rounded-lg group-hover:scale-110 transition-transform">
                                <Upload size={18} />
                            </div>
                            <div className="text-left">
                                <span className="block text-sm font-bold text-stone-800">Restore Data</span>
                                <span className="block text-[10px] text-stone-400">Import a backup file</span>
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </section>

      </div>
    </div>
  );
};