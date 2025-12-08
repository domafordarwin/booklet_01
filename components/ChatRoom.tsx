import React, { useState, useEffect, useRef } from 'react';
import { Book, Message, MessageType, ReadingStatus } from '../types';
import { ArrowLeft, Send, Quote, BrainCircuit, Star, CheckCircle2, MoreVertical, X, Hash, FileText, ChevronRight } from './Icons';
import * as GeminiService from '../services/geminiService';

interface ChatRoomProps {
  book: Book;
  messages: Message[];
  onBack: () => void;
  onSendMessage: (text: string, type: MessageType, sender: 'user' | 'book', extras?: { page?: string, thought?: string, keywords?: string[] }) => void;
  onUpdateBook: (updates: Partial<Book>) => void;
  onUpdateMessage: (messageId: string, updates: Partial<Message>) => void;
}

type ModalTab = 'PAGE' | 'CONTENT';

export const ChatRoom: React.FC<ChatRoomProps> = ({ 
  book, 
  messages, 
  onBack, 
  onSendMessage,
  onUpdateBook,
  onUpdateMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Quote Mode Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [activeTab, setActiveTab] = useState<ModalTab>('PAGE');
  
  const [quotePage, setQuotePage] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteThought, setQuoteThought] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showQuoteModal]);

  // Reset modal state when opening
  useEffect(() => {
    if (showQuoteModal) {
        setQuotePage('');
        setQuoteText('');
        setQuoteThought('');
        setActiveTab('PAGE');
    }
  }, [showQuoteModal]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    onSendMessage(text, MessageType.TEXT, 'user');
    
    if (isAiMode) {
        const response = await GeminiService.chatWithBook(book, messages, text);
        onSendMessage(response, MessageType.AI_RESPONSE, 'book');
    }
  };

  const handleSendQuote = () => {
      if (!quoteText.trim()) return;

      const page = quotePage;
      const thought = quoteThought;
      const text = quoteText;

      // Close modal and reset
      setShowQuoteModal(false);

      // Send message
      onSendMessage(text, MessageType.QUOTE, 'user', { page, thought });
  };

  // Effect to handle auto-keyword generation for new quotes
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'user' && lastMsg.type === MessageType.QUOTE && !lastMsg.keywords) {
        // Optimistically generate keywords
        GeminiService.extractKeywords(lastMsg.text).then(keywords => {
            if (keywords.length > 0) {
                onUpdateMessage(lastMsg.id, { keywords });
            }
        });
    }
  }, [messages.length]); 

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const toggleStatus = () => {
    const nextStatus = book.status === ReadingStatus.READING 
        ? ReadingStatus.COMPLETED 
        : ReadingStatus.READING;
    
    onUpdateBook({ status: nextStatus });
    onSendMessage(
        nextStatus === ReadingStatus.COMPLETED ? "🎉 Finished reading this book!" : "📖 Started reading again.", 
        MessageType.SYSTEM, 
        'user'
    );
    setShowSettings(false);
  };

  const updateRating = (rating: number) => {
    onUpdateBook({ rating });
    setShowSettings(false);
    onSendMessage(`Rated this book ${rating} stars! ⭐`, MessageType.SYSTEM, 'user');
  };

  return (
    <div className="flex flex-col h-full bg-[#fdfbf7]"> 
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#fdfbf7]/90 backdrop-blur-md sticky top-0 z-20 border-b border-stone-200">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 text-stone-600 hover:bg-stone-200/50 rounded-full transition">
            <ArrowLeft size={24} />
          </button>
          <div className="ml-2">
            <h1 className="font-serif font-bold text-stone-900 text-lg leading-tight truncate max-w-[200px]">{book.title}</h1>
            <p className="text-xs text-stone-500 flex items-center gap-1 font-sans">
               {book.author}
               {book.status === ReadingStatus.COMPLETED && <CheckCircle2 size={12} className="text-stone-800" />}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
             <button 
                onClick={() => {
                    setIsAiMode(!isAiMode);
                }}
                className={`p-2 rounded-full transition-all border ${isAiMode ? 'bg-amber-100 text-amber-900 border-amber-200 shadow-sm' : 'border-transparent text-stone-400 hover:bg-stone-100'}`}
                title="Chat with Book AI"
            >
                <BrainCircuit size={20} />
            </button>
            <div className="relative">
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition">
                    <MoreVertical size={20} />
                </button>
                {showSettings && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-30 py-2 border border-stone-100 ring-1 ring-black ring-opacity-5">
                        <button 
                            onClick={toggleStatus}
                            className="w-full text-left px-4 py-2 hover:bg-stone-50 text-sm text-stone-700 flex items-center gap-2"
                        >
                            <CheckCircle2 size={16} />
                            {book.status === ReadingStatus.COMPLETED ? 'Mark as Reading' : 'Mark as Finished'}
                        </button>
                        <div className="px-4 py-2 border-t border-stone-100">
                            <p className="text-xs text-stone-400 mb-2 font-medium uppercase tracking-wider">Rate Book</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button 
                                        key={star} 
                                        onClick={() => updateRating(star)}
                                        className={`${book.rating >= star ? 'text-amber-400' : 'text-stone-200'} hover:scale-110 transition`}
                                    >
                                        <Star size={20} fill={book.rating >= star ? "currentColor" : "none"} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* Added Date */}
        <div className="flex justify-center mb-6">
            <span className="text-[10px] tracking-widest text-stone-400 font-serif uppercase border-b border-stone-200 pb-1">
                Started {new Date(book.addedAt).toLocaleDateString()}
            </span>
        </div>
        
        {messages.map((msg, index) => {
           const isUser = msg.sender === 'user';
           
           if (msg.type === MessageType.SYSTEM) {
               return (
                   <div key={msg.id} className="flex justify-center my-6">
                       <span className="text-xs text-stone-500 italic bg-stone-100 px-4 py-1.5 rounded-full">
                           {msg.text}
                       </span>
                   </div>
               );
           }

           // QUOTE CARD STYLE (Revised: Comma Separated)
           if (msg.type === MessageType.QUOTE) {
               return (
                   <div key={msg.id} className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-500 w-full">
                       <div className="w-full max-w-sm bg-white border border-stone-200 shadow-sm rounded-xl overflow-hidden p-0 relative group">
                           
                           {/* Main Quote Content */}
                           <div className="px-6 py-5">
                                <p className="font-serif text-lg leading-relaxed text-stone-800 italic">
                                    {msg.page && (
                                        <span className="not-italic text-amber-700 font-bold font-sans text-sm mr-2 select-none">
                                            p.{msg.page},
                                        </span>
                                    )}
                                    "{msg.text}"
                                </p>
                           </div>

                           {/* Thought Section (Separate Block) */}
                           {msg.thought && (
                               <div className="bg-amber-50/50 px-5 py-3 border-t border-stone-100">
                                   <div className="flex items-start gap-2">
                                       <FileText size={14} className="text-amber-700/50 mt-0.5 flex-shrink-0" />
                                       <p className="text-sm text-stone-600 font-sans leading-snug">
                                           {msg.thought}
                                       </p>
                                   </div>
                               </div>
                           )}

                           {/* Keywords / Tags Footer */}
                           <div className="px-4 py-2 bg-stone-50/50 border-t border-stone-100 flex flex-wrap gap-2 min-h-[40px] items-center">
                               {msg.keywords && msg.keywords.length > 0 ? (
                                   msg.keywords.map((kw, i) => (
                                       <button key={i} className="text-[10px] bg-white border border-stone-200 text-stone-600 px-2.5 py-1 rounded-full hover:bg-stone-100 hover:border-stone-300 transition-colors shadow-sm font-medium">
                                           #{kw}
                                       </button>
                                   ))
                               ) : (
                                   <span className="text-[10px] text-stone-400 animate-pulse flex items-center">
                                       <BrainCircuit size={10} className="mr-1" /> Analyzing...
                                   </span>
                               )}
                           </div>
                       </div>
                       <span className="text-[10px] text-stone-300 mt-2 font-mono">
                           {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                       </span>
                   </div>
               );
           }

           // STANDARD CHAT BUBBLE (Text or AI)
           return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                  <div className="w-8 h-8 rounded-full mr-3 flex-shrink-0 bg-stone-200 overflow-hidden border border-stone-300">
                     {book.coverUrl ? (
                         <img src={book.coverUrl} className="w-full h-full object-cover" alt="book" />
                     ) : (
                         <div className="w-full h-full flex items-center justify-center text-stone-500 font-bold text-xs">{book.title[0]}</div>
                     )}
                  </div>
              )}
              
              <div className={`max-w-[80%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  {!isUser && (
                      <span className="text-[10px] font-bold text-stone-500 mb-1 ml-1 font-serif">{book.title}</span>
                  )}
                  <div 
                    className={`
                        px-4 py-2.5 text-sm shadow-sm
                        ${isUser 
                            ? 'bg-stone-800 text-stone-50 rounded-2xl rounded-tr-sm font-light' 
                            : 'bg-white text-stone-800 border border-stone-200 rounded-2xl rounded-tl-sm font-serif'
                        }
                    `}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-stone-300 mt-1 mx-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
              </div>
            </div>
           );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quote Creation Modal Overlay with Explicit Tabs */}
      {showQuoteModal && (
          <div className="absolute inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col h-[75vh] sm:h-auto sm:max-h-[90vh]">
                  
                  {/* Header */}
                  <div className="flex justify-between items-center px-6 py-5 border-b border-stone-100">
                        <div className="flex items-center gap-2 text-stone-800">
                            <div className="p-1.5 bg-amber-100 rounded text-amber-700">
                                <Quote size={20} />
                            </div>
                            <h2 className="font-serif font-bold text-xl">Log a Passage</h2>
                        </div>
                        <button onClick={() => setShowQuoteModal(false)} className="text-stone-400 hover:text-stone-600 p-1">
                            <X size={24} />
                        </button>
                  </div>

                  {/* Split Tabs - Visual Separation */}
                  <div className="flex px-6 pt-2 gap-4 border-b border-stone-100 bg-stone-50/50">
                        <button 
                            onClick={() => setActiveTab('PAGE')}
                            className={`flex-1 pb-3 pt-2 text-sm font-bold transition-all border-b-2 
                                ${activeTab === 'PAGE' 
                                    ? 'border-amber-500 text-stone-900' 
                                    : 'border-transparent text-stone-400 hover:text-stone-600'}
                            `}
                        >
                            1. Page No.
                        </button>
                        <button 
                            onClick={() => setActiveTab('CONTENT')}
                            className={`flex-1 pb-3 pt-2 text-sm font-bold transition-all border-b-2
                                ${activeTab === 'CONTENT' 
                                    ? 'border-amber-500 text-stone-900' 
                                    : 'border-transparent text-stone-400 hover:text-stone-600'}
                            `}
                        >
                            2. Content & Thought
                        </button>
                  </div>

                  {/* Body - Tab Content */}
                  <div className="flex-1 p-8 overflow-y-auto">
                      
                      {activeTab === 'PAGE' && (
                          <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in slide-in-from-left-4 duration-300">
                              <div className="text-center w-full">
                                  <label className="block text-stone-400 font-serif italic mb-4 text-lg">Page Number</label>
                                  <div className="relative inline-block w-full max-w-[200px]">
                                    <input 
                                        type="number" 
                                        pattern="[0-9]*"
                                        value={quotePage}
                                        onChange={(e) => setQuotePage(e.target.value)}
                                        placeholder="0" 
                                        autoFocus
                                        className="w-full text-center bg-transparent border-b-2 border-stone-200 py-4 text-6xl font-serif text-stone-800 placeholder-stone-200 focus:border-amber-500 focus:outline-none transition-colors"
                                    />
                                    <span className="absolute -right-4 bottom-8 text-stone-400 font-medium text-lg">p.</span>
                                  </div>
                              </div>
                              <p className="text-sm text-stone-400 text-center bg-stone-50 px-4 py-2 rounded-lg">
                                  Start by entering the page number.<br/>This allows for sorting and filtering later.
                              </p>
                          </div>
                      )}

                      {activeTab === 'CONTENT' && (
                          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                              {/* The Quote */}
                              <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">The Passage</label>
                                    {quotePage && <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Page {quotePage}</span>}
                                  </div>
                                  <textarea 
                                     value={quoteText}
                                     onChange={(e) => setQuoteText(e.target.value)}
                                     placeholder="Type the text exactly as it appears in the book..."
                                     autoFocus
                                     className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-4 text-base font-serif italic focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none h-40 resize-none leading-relaxed placeholder:not-italic placeholder:text-stone-300"
                                  />
                              </div>

                              {/* Thoughts */}
                              <div>
                                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Your Reflection (Optional)</label>
                                  <textarea 
                                     value={quoteThought}
                                     onChange={(e) => setQuoteThought(e.target.value)}
                                     placeholder="What did you think about this?"
                                     className="w-full bg-white border border-stone-200 rounded-xl px-4 py-4 text-sm focus:ring-2 focus:ring-stone-500/20 focus:border-stone-500 outline-none h-24 resize-none placeholder:text-stone-300"
                                  />
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Footer Action */}
                  <div className="p-6 border-t border-stone-100 bg-stone-50 sm:rounded-b-2xl">
                      {activeTab === 'PAGE' ? (
                          <button 
                             onClick={() => setActiveTab('CONTENT')}
                             className="w-full py-4 rounded-xl font-bold text-base tracking-wide bg-stone-900 text-white hover:bg-stone-800 shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                          >
                              Next Step <ChevronRight size={18} />
                          </button>
                      ) : (
                          <button 
                            onClick={handleSendQuote}
                            disabled={!quoteText.trim()}
                            className={`w-full py-4 rounded-xl font-bold text-base tracking-wide shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2
                                ${quoteText.trim() ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}
                            `}
                          >
                              <CheckCircle2 size={20} />
                              Save Passage
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Main Input Bar */}
      <div className="bg-white border-t border-stone-100 p-2 sm:p-4 sticky bottom-0 safe-area-bottom z-10">
            {isAiMode && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 py-1 px-3 rounded-full mb-2 w-max mx-auto flex items-center shadow-sm animate-pulse">
                    <BrainCircuit size={12} className="mr-1.5" />
                    Chatting with {book.title}
                </div>
            )}
            <div className="flex items-end gap-2">
                {/* Quote Button (FAB style) */}
                <button 
                    onClick={() => setShowQuoteModal(true)}
                    className="p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors flex-shrink-0"
                    title="Log a Quote"
                >
                    <Quote size={20} />
                </button>
                
                {/* Text Input */}
                <div className="flex-1 bg-stone-100 rounded-xl flex items-center p-1 border border-transparent focus-within:border-stone-300 focus-within:bg-white transition-all">
                    <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => {
                            setInputText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                        }}
                        onKeyDown={handleKeyPress}
                        placeholder={isAiMode ? `Ask ${book.title} a question...` : "Type a quick note..."}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none text-sm px-3 py-2.5 max-h-[100px] text-stone-900 placeholder-stone-400"
                        rows={1}
                    />
                </div>

                {/* Send Button */}
                <button 
                    onClick={handleSendText}
                    disabled={!inputText.trim()}
                    className={`p-3 rounded-xl flex-shrink-0 transition-all transform active:scale-95 shadow-sm ${
                        inputText.trim() 
                        ? 'bg-stone-900 text-white hover:bg-stone-700' 
                        : 'bg-stone-100 text-stone-300'
                    }`}
                >
                    <Send size={20} fill={inputText.trim() ? "currentColor" : "none"} />
                </button>
            </div>
      </div>
    </div>
  );
};