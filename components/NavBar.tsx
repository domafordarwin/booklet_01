import React from 'react';
import { ViewMode } from '../types';
import { MessageCircle, Settings, User } from './Icons';

interface NavBarProps {
    currentMode: ViewMode;
    onChangeMode: (mode: ViewMode) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentMode, onChangeMode }) => {
    // Only show navbar in main views
    if (currentMode === 'CHAT' || currentMode === 'ADD_BOOK' || currentMode === 'ONBOARDING') return null;

    const navItemClass = (active: boolean) => 
        `flex flex-col items-center justify-center w-full py-3 ${active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'}`;

    return (
        <div className="bg-white border-t border-stone-100 flex justify-around items-center safe-area-bottom shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
            <button 
                onClick={() => onChangeMode('LIST')} 
                className={navItemClass(currentMode === 'LIST')}
            >
                <MessageCircle size={24} fill={currentMode === 'LIST' ? "currentColor" : "none"} strokeWidth={currentMode === 'LIST' ? 2 : 2} />
                <span className="text-[10px] mt-1 font-medium">Library</span>
            </button>
            <button 
                onClick={() => onChangeMode('PROFILE')} 
                className={navItemClass(currentMode === 'PROFILE')}
            >
                <User size={24} fill={currentMode === 'PROFILE' ? "currentColor" : "none"} strokeWidth={currentMode === 'PROFILE' ? 2 : 2} />
                <span className="text-[10px] mt-1 font-medium">My Account</span>
            </button>
            <button 
                onClick={() => onChangeMode('SETTINGS')} 
                className={navItemClass(currentMode === 'SETTINGS')}
            >
                <Settings size={24} fill={currentMode === 'SETTINGS' ? "currentColor" : "none"} strokeWidth={currentMode === 'SETTINGS' ? 2 : 2} />
                <span className="text-[10px] mt-1 font-medium">Settings</span>
            </button>
        </div>
    );
};