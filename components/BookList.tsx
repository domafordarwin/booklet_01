import React from 'react';
import { Book, ReadingStatus } from '../types';
import { Plus, Book as BookIcon } from './Icons';

interface BookListProps {
  books: Book[];
  onSelectBook: (bookId: string) => void;
  onAddBook: () => void;
}

export const BookList: React.FC<BookListProps> = ({ books, onSelectBook, onAddBook }) => {
  
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-6 bg-stone-50 sticky top-0 z-10 border-b border-stone-200/50">
        <div>
           <h1 className="text-3xl font-serif font-bold text-stone-900">My Library</h1>
           <p className="text-stone-500 text-sm mt-1">Your reading journey, archived.</p>
        </div>
        <div className="flex space-x-4">
           <button onClick={onAddBook} className="text-stone-800 bg-white border border-stone-200 hover:bg-stone-100 p-3 rounded-full shadow-sm transition-all">
              <Plus size={20} />
           </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4">
        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-stone-400">
            <BookIcon size={48} className="mb-4 opacity-30" />
            <p className="font-serif italic">Your shelves are empty.</p>
            <p className="text-sm">Start a new book log today.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {books.sort((a,b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)).map((book) => (
              <li 
                key={book.id} 
                onClick={() => onSelectBook(book.id)}
                className="flex items-start p-4 bg-white rounded-xl shadow-sm border border-stone-100 hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group"
              >
                {/* Cover / Avatar */}
                <div className="relative flex-shrink-0 mr-5">
                  <div className="w-16 h-24 shadow-md rounded-md overflow-hidden bg-stone-200">
                    {book.coverUrl ? (
                        <img 
                        src={book.coverUrl} 
                        alt={book.title} 
                        className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400">
                        <BookIcon size={24} />
                        </div>
                    )}
                  </div>
                  {book.status === ReadingStatus.COMPLETED && (
                    <div className="absolute -top-2 -right-2 bg-stone-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm">
                       DONE
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex justify-between items-start mb-1">
                    <h2 className="text-lg font-serif font-bold text-stone-900 truncate pr-2 group-hover:text-amber-800 transition-colors">
                      {book.title}
                    </h2>
                    <span className="text-xs text-stone-400 font-light flex-shrink-0 mt-1">
                      {formatDate(book.lastMessageTime)}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 mb-3">{book.author}</p>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-stone-500 truncate pr-4 italic max-w-[200px]">
                      {book.lastMessage || `Started reading...`}
                    </p>
                    {book.rating > 0 && (
                        <div className="flex text-amber-500 text-xs">
                           {'★'.repeat(book.rating)}
                        </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};