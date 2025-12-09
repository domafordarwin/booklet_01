import React, { useState, useEffect } from 'react';
import { Book, Message, ViewMode, ReadingStatus, MessageType, UserProfile } from './types';
import * as StorageService from './services/storageService';
import * as GeminiService from './services/geminiService';
import { supabase, testConnection } from './services/supabaseClient';
import { BookList } from './components/BookList';
import { ChatRoom } from './components/ChatRoom';
import { AddBookView } from './components/AddBookView';
import { NavBar } from './components/NavBar';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { Loader2, BrainCircuit, Download, AlertTriangle, CheckCircle2, X } from './components/Icons';

function App() {
  const [mode, setMode] = useState<ViewMode>('ONBOARDING');
  const [activeBookId, setActiveBookId] = useState<string | undefined>(undefined);
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Run connection test on mount to inform user
  useEffect(() => {
    if (supabase) {
        testConnection().then(result => {
            setTestResult(result);
            // If strictly successful (and not a warning), hide after 4 seconds
            if (result.success && !result.message.includes('Warning')) {
                setTimeout(() => setTestResult(null), 4000);
            }
        });
    }
  }, []);

  // Initial Auth Check
  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes if using Supabase
    if (supabase) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setUserProfile(null);
                setMode('ONBOARDING');
            } else if (event === 'SIGNED_IN') {
                checkUser();
            }
        });
        return () => subscription.unsubscribe();
    }
  }, []);

  const checkUser = async () => {
      setLoading(true);
      try {
          const user = await StorageService.getCurrentUser();
          if (user) {
              const profile = await StorageService.getUserProfile();
              if (profile) {
                  setUserProfile(profile);
                  await loadBooks();
                  setMode('LIST');
              } else {
                  // User exists (likely auth) but no profile row yet
                  setMode('ONBOARDING'); 
              }
          } else {
              setMode('ONBOARDING');
          }
      } catch (e) {
          console.error("Auth check failed", e);
          setMode('ONBOARDING');
      } finally {
          setLoading(false);
      }
  };

  const loadBooks = async () => {
      const fetchedBooks = await StorageService.getBooks();
      setBooks(fetchedBooks);
  };

  // Load messages when entering chat
  useEffect(() => {
    if (activeBookId) {
      const loadMessages = async () => {
          const msgs = await StorageService.getMessages(activeBookId);
          setMessages(msgs);
      };
      loadMessages();
    }
  }, [activeBookId]);

  const handleAuthSuccess = async (profile: UserProfile) => {
      setUserProfile(profile);
      await loadBooks();
      setMode('LIST');
  };

  const handleLogout = () => {
      setUserProfile(null);
      setBooks([]);
      setMessages([]);
      setMode('ONBOARDING');
  };

  const handleSelectBook = (bookId: string) => {
    setActiveBookId(bookId);
    setMode('CHAT');
  };

  const handleAddBook = async (title: string, author: string, coverUrl: string) => {
    const newBook: Book = {
      id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
      bookId: newBook.id,
      text: welcomeText,
      type: MessageType.SYSTEM,
      timestamp: Date.now(),
      sender: 'book'
    };
    
    newBook.lastMessage = welcomeText;

    // Optimistic UI update
    const prevBooks = [...books];
    setBooks([newBook, ...books]);
    setMode('LIST');

    try {
        // Async save
        await StorageService.saveBook(newBook);
        await StorageService.addMessage(welcomeMsg);
    } catch (error: any) {
        console.error("Failed to save book:", error);
        alert(`Failed to save book: ${error.message || 'Unknown error'}`);
        setBooks(prevBooks); // Rollback
    }
  };

  const handleSendMessage = async (
      text: string, 
      type: MessageType, 
      sender: 'user' | 'book',
      extras?: { page?: string, thought?: string, keywords?: string[] }
  ) => {
    if (!activeBookId) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      bookId: activeBookId,
      text,
      type,
      timestamp: Date.now(),
      sender,
      ...extras
    };

    // Snapshot for rollback
    const prevMessages = [...messages];
    const prevBooks = [...books];

    // Optimistic Update
    setMessages(prev => [...prev, newMessage]);
    
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

    try {
        // Async save
        await StorageService.addMessage(newMessage);
        
        // Find the updated book to save it (update timestamp)
        const updatedBook = updatedBooks.find(b => b.id === activeBookId);
        if (updatedBook) await StorageService.saveBook(updatedBook);

    } catch (error: any) {
        console.error("Failed to send message:", error);
        alert(`Failed to save message: ${error.message || 'Database error'}`);
        // Rollback
        setMessages(prevMessages);
        setBooks(prevBooks);
    }
  };

  const handleUpdateMessage = async (messageId: string, updates: Partial<Message>) => {
    if (!activeBookId) return;

    setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
    ));
    
    try {
        await StorageService.updateMessage(messageId, updates);
    } catch (e) {
        console.error("Failed to update message keywords", e);
    }
  };

  const handleUpdateBook = async (updates: Partial<Book>) => {
      if (!activeBookId) return;
      
      const updatedBooks = books.map(b => 
          b.id === activeBookId ? { ...b, ...updates } : b
      );
      setBooks(updatedBooks);
      
      const updatedBook = updatedBooks.find(b => b.id === activeBookId);
      if (updatedBook) {
          try {
              await StorageService.saveBook(updatedBook);
          } catch (error) {
              console.error("Failed to update book status", error);
          }
      }
  };

  const handleRunConnectionTest = async () => {
    setIsTesting(true);
    // don't clear result immediately to prevent flickering if it's fast
    try {
        const result = await testConnection();
        setTestResult(result);
    } catch (e) {
        setTestResult({ success: false, message: "Unknown error during test." });
    } finally {
        setIsTesting(false);
    }
  };

  const handleSeedStatusAnxiety = async () => {
      setSeeding(true);
      try {
          await StorageService.seedStatusAnxiety();
          await loadBooks();
          setMode('LIST');
      } catch (error: any) {
          alert("Error adding sample book: " + error.message);
      } finally {
          setSeeding(false);
      }
  };

  if (loading) {
      return (
          <div className="flex h-screen items-center justify-center bg-[#fdfbf7]">
              <Loader2 className="animate-spin text-stone-400" size={32} />
          </div>
      );
  }

  const renderContent = () => {
    switch (mode) {
      case 'ONBOARDING':
          return <AuthView onAuthSuccess={handleAuthSuccess} />;

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
                  onLogout={handleLogout}
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
                    
                    {/* Cloud Connection Test Section */}
                    <section>
                        <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Cloud Connection</h2>
                        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-base font-bold text-stone-800">Supabase Status</span>
                                <div className={`flex items-center gap-2 ${supabase ? 'text-stone-900' : 'text-stone-400'}`}>
                                    <span className="text-xs font-mono">{supabase ? 'CONFIGURED' : 'DEMO MODE'}</span>
                                    <div className={`w-3 h-3 rounded-full ${supabase ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                </div>
                            </div>
                            
                            <div className="bg-stone-50 p-3 rounded-lg border border-stone-100 mb-4 font-mono text-xs text-stone-500 break-all">
                                URL: {supabase ? 'CONFIGURED' : 'NOT SET'}
                            </div>

                            <button 
                                onClick={handleRunConnectionTest}
                                disabled={isTesting || !supabase}
                                className={`w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2
                                    ${isTesting ? 'bg-stone-100 text-stone-400' : 'bg-stone-900 text-white hover:bg-stone-800'}
                                    ${!supabase && 'opacity-50 cursor-not-allowed'}
                                `}
                            >
                                {isTesting ? (
                                    <>
                                        <Loader2 className="animate-spin" size={16} />
                                        Testing Connection...
                                    </>
                                ) : (
                                    'Test Connection'
                                )}
                            </button>
                        </div>
                    </section>

                    {/* Seed Data Section */}
                    <section>
                         <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">Sample Data</h2>
                         <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
                             <p className="text-sm text-stone-600 mb-4">
                                 Add "Status Anxiety" by Alain de Botton to test the library features without uploading images manually.
                             </p>
                             <button
                                onClick={handleSeedStatusAnxiety}
                                disabled={seeding}
                                className="w-full py-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 font-bold text-sm hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                             >
                                 {seeding ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                                 Add 'Status Anxiety' (Sample)
                             </button>
                         </div>
                    </section>

                    <section>
                        <h2 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-4">About</h2>
                        <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
                            <p className="text-stone-600 text-sm leading-relaxed">
                                BookTalk v2.1
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
      {/* Global Connection Banner */}
      {testResult && (
        <div className={`absolute top-0 left-0 right-0 z-50 p-3 text-sm font-medium text-center animate-in slide-in-from-top-2 shadow-md flex items-center justify-between px-4 ${
            testResult.success 
                ? (testResult.message.includes('Warning') ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800')
                : 'bg-red-100 text-red-800'
        }`}>
            <div className="flex items-center gap-2 mx-auto">
                {testResult.success 
                    ? (testResult.message.includes('Warning') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16}/>) 
                    : <AlertTriangle size={16}/>
                } 
                <span className="truncate max-w-[280px]">{testResult.message}</span>
            </div>
            <button onClick={() => setTestResult(null)} className="opacity-60 hover:opacity-100 p-1">
                <X size={16}/>
            </button>
        </div>
      )}
      
      <div className="flex-1 overflow-hidden relative">
        {renderContent()}
      </div>
      <NavBar currentMode={mode} onChangeMode={setMode} />
    </div>
  );
}

export default App;