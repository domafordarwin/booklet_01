import React from 'react';
import { ViewMode } from '../types';
import { MessageCircle, Settings, User } from 'lucide-react';

interface NavBarProps {
    currentMode: ViewMode;
    onChangeMode: (mode: ViewMode) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ currentMode, onChangeMode }) => {
    // Only show navbar in List mode or Settings mode, not inside a Chat
    if (currentMode === 'CHAT' || currentMode === 'ADD_BOOK') return null;

    const navItemClass = (active: boolean) => 
        `flex flex-col items-center justify-center w-full py-3 ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'}`;

    return (
        <div className="bg-white border-t border-gray-100 flex justify-around items-center safe-area-bottom">
            <button 
                onClick={() => onChangeMode('LIST')} 
                className={navItemClass(currentMode === 'LIST')}
            >
                <MessageCircle size={24} fill={currentMode === 'LIST' ? "currentColor" : "none"} />
                <span className="text-[10px] mt-1">Chats</span>
            </button>
            <button 
                className={navItemClass(false)} // Placeholder for "Search" or "Friends"
            >
                <User size={24} />
                <span className="text-[10px] mt-1">Profile</span>
            </button>
            <button 
                onClick={() => onChangeMode('SETTINGS')} 
                className={navItemClass(currentMode === 'SETTINGS')}
            >
                <Settings size={24} />
                <span className="text-[10px] mt-1">More</span>
            </button>
        </div>
    );
};