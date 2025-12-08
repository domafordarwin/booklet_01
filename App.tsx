import React, { useState, useEffect } from 'react';
import { Book, Message, ViewMode, ReadingStatus, MessageType } from './types';
import * as StorageService from './services/storageService';
import * as GeminiService from './services/geminiService';
import { BookList } from './components/BookList';
import { ChatRoom } from './components/ChatRoom';
import { AddBookView } from './components/AddBookView';
import { NavBar } from './components/NavBar';
import { Settings } from './components/Icons';

function App() {
  const [mode, setMode] = useState<ViewMode>('LIST');
  const [activeBookId, setActiveBookId] = useState<string | undefined>(undefined);
  const [books, setBooks] = useState<Book[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load initial data
  useEffect(() => {
    StorageService.seedInitialData();
    setBooks(StorageService.getBooks());
  }, []);

  // Load messages when entering chat
  useEffect(() => {
    if (activeBookId) {
      setMessages(StorageService.getMessages(activeBookId));
    }
  }, [activeBookId]);

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

  const renderContent = () => {
    switch (mode) {
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
      case 'SETTINGS':
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Settings</h1>
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-2">
                    <p className="text-gray-600">App Version: 1.1.0</p>
                    <p className="text-gray-500 text-sm">Use your API Key in .env to enable AI features.</p>
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
      <NavBar currentMode={mode} onChangeMode={setMode} />
    </div>
  );
}

export default App;