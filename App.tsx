import React, { useState, useEffect, useRef } from 'react';
import { Book, Message, ViewMode, ReadingStatus, MessageType, UserProfile } from './types';
import * as StorageService from './services/storageService';
import * as GeminiService from './services/geminiService';
import { BookList } from './components/BookList';
import { ChatRoom } from './components/ChatRoom';
import { AddBookView } from './components/AddBookView';
import { NavBar } from './components/NavBar';
import { ProfileView } from './components/ProfileView';
import { Settings as SettingsIcon, Download, Upload, CheckCircle2, User } from './components/Icons';

function App() {
  const [mode, setMode] = useState<ViewMode>('ONBOARDING'); // Default to checking onboarding
  const [activeBookId, setActiveBookId] = useState<string | undefined>(undefined);
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [onboardingName, setOnboardingName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    // Check for profile first
    const profile = StorageService.getUserProfile();
    if (profile) {
        setUserProfile(profile);
        setBooks(StorageService.getBooks());
        setMode('LIST');
    } else {
        // No profile, stay in ONBOARDING mode
        setMode('ONBOARDING');
    }
  }, []);

  // Load messages when entering chat
  useEffect(() => {
    if (activeBookId) {
      setMessages(StorageService.getMessages(activeBookId));
    }
  }, [activeBookId]);

  const handleCompleteOnboarding = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onboardingName.trim()) return;

      const newProfile: UserProfile = {
          name: onboardingName.trim(),
          joinedAt: Date.now()
      };
      
      setUserProfile(newProfile);
      StorageService.saveUserProfile(newProfile);
      
      // Seed demo data only for new users
      StorageService.seedDemoBook();
      setBooks(StorageService.getBooks());
      
      setMode('LIST');
  };

  const handleSelectBook = (bookId: string) => {
    setActiveBookId(bookId);
    setMode('CHAT');
  };

  const handleAddBook = async (title: string, author: string, coverUrl: string) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      author,
      coverUrl,
      status: ReadingStatus.TO_READ,
      rating: 0,
      addedAt: Date.now(),
      lastMessageTime: Date.now(),
    };

    // Generate welcome message using AI or Default
    const welcomeText = await GeminiService.generateBookWelcome(title, author);
    
    const welcomeMsg: Message = {
      id: Date.now().toString() + '-init',
      bookId: newBook.id,
      text: welcomeText,
      type: MessageType.SYSTEM,
      timestamp: Date.now(),
      sender: 'book'
    };
    
    newBook.lastMessage = welcomeText;

    const updatedBooks = [newBook, ...books];
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);
    StorageService.saveMessages(newBook.id, [welcomeMsg]);

    setMode('LIST');
  };

  const handleSendMessage = (
      text: string, 
      type: MessageType, 
      sender: 'user' | 'book',
      extras?: { page?: string, thought?: string, keywords?: string[] }
  ) => {
    if (!activeBookId) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      bookId: activeBookId,
      text,
      type,
      timestamp: Date.now(),
      sender,
      ...extras
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    StorageService.saveMessages(activeBookId, updatedMessages);

    // Update Book list preview
    const updatedBooks = books.map(b => {
      if (b.id === activeBookId) {
        return {
          ...b,
          lastMessage: type === MessageType.IMAGE ? 'Sent an image' : (type === MessageType.QUOTE ? `Quote: ${text}` : text),
          lastMessageTime: newMessage.timestamp
        };
      }
      return b;
    });
    setBooks(updatedBooks);
    StorageService.saveBooks(updatedBooks);
  };

  const handleUpdateMessage = (messageId: string, updates: Partial<Message>) => {
    if (!activeBookId) return;

    const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
    );
    setMessages(updatedMessages);
    StorageService.saveMessages(activeBookId, updatedMessages);
  };

  const handleUpdateBook = (updates: Partial<Book>) => {
      if (!activeBookId) return;
      const updatedBooks = books.map(b => 
          b.id === activeBookId ? { ...b, ...updates } : b
      );
      setBooks(updatedBooks);
      StorageService.saveBooks(updatedBooks);
  };

  // --- Backup Functions ---
  const handleExportData = () => {
    const backupData = StorageService.createBackup();
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `booktalk_backup_${userProfile?.name || 'user'}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = event.target?.result as string;
            const data = JSON.parse(json);
            StorageService.restoreBackup(data);
            
            // Reload state
            const newProfile = StorageService.getUserProfile();
            if (newProfile) setUserProfile(newProfile);
            setBooks(StorageService.getBooks());
            
            alert('Backup restored successfully!');
            setMode('LIST');
        } catch (err) {
            console.error(err);
            alert('Failed to restore backup. Invalid file.');
        }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderContent = () => {
    switch (mode) {
      case 'ONBOARDING':
          return (
              <div className="flex flex-col h-full bg-[#fdfbf7] p-8 items-center justify-center">
                  <div className="w-full max-w-sm">
                      <div className="mb-10 text-center">
                          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">BookTalk</h1>
                          <p className="text-stone-500">Your personal reading archive.</p>
                      </div>
                      
                      <form onSubmit={handleCompleteOnboarding} className="space-y-6">
                          <div>
                              <label className="block text-sm font-bold text-stone-400 uppercase tracking-wider mb-2">
                                  What should we call you?
                              </label>
                              <input 
                                  type="text" 
                                  value={onboardingName}
                                  onChange={(e) => setOnboardingName(e.target.value)}
                                  placeholder="Enter your name"
                                  className="w-full bg-white border-b-2 border-stone-200 py-3 text-2xl font-serif text-stone-900 focus:outline-none focus:border-amber-500 placeholder-stone-200 transition-colors"
                                  autoFocus
                              />
                          </div>
                          
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                              <p className="text-xs text-amber-800 leading-relaxed">
                                  <strong>Note:</strong> Your data is stored locally on this device. You can create backups from your profile page later.
                              </p>
                          </div>

                          <button 
                              type="submit" 
                              disabled={!onboardingName.trim()}
                              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-transform active:scale-95
                                  ${onboardingName.trim() ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}
                              `}
                          >
                              Start Archiving
                          </button>
                      </form>
                  </div>
              </div>
          );

      case 'LIST':
        return (
          <BookList 
            books={books} 
            onSelectBook={handleSelectBook} 
            onAddBook={() => setMode('ADD_BOOK')}
          />
        );
      case 'CHAT':
        const activeBook = books.find(b => b.id === activeBookId);
        if (!activeBook) return <div>Book not found</div>;
        return (
          <ChatRoom 
            book={activeBook} 
            messages={messages} 
            onBack={() => setMode('LIST')}
            onSendMessage={handleSendMessage}
            onUpdateBook={handleUpdateBook}
            onUpdateMessage={handleUpdateMessage}
          />
        );
      case 'ADD_BOOK':
        return (
          <AddBookView 
            onAdd={handleAddBook} 
            onCancel={() => setMode('LIST')} 
          />
        );
      case 'PROFILE':
          if (!userProfile) return null;
          return (
              <ProfileView 
                  profile={userProfile}
                  books={books}
                  onExportData={handleExportData}
                  onImportData={handleImportClick}
              />
          );
      case 'SETTINGS':
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                   <h1 className="text-2xl font-serif font-bold text-gray-900">Settings</h1>
                   <p className="text-gray-500 text-sm mt-1">App Configuration</p>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* About Section */}
                    <section>
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">About</h2>
                        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-serif font-bold text-gray-900">BookTalk</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">v1.3.0</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                A personal reading archive designed to feel like a conversation. Log your thoughts, chat with your books, and keep your memories safe.
                            </p>
                        </div>
                    </section>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 shadow-2xl relative">
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
      {/* Hidden input for file upload */}
      <input 
         type="file" 
         ref={fileInputRef}
         onChange={handleFileChange}
         accept=".json"
         className="hidden"
      />
      <NavBar currentMode={mode} onChangeMode={setMode} />
    </div>
  );
}

export default App;