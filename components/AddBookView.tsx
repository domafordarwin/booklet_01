import React, { useState } from 'react';
import { ArrowLeft, ImageIcon, Plus } from './Icons';

interface AddBookViewProps {
  onAdd: (title: string, author: string, coverUrl: string) => void;
  onCancel: () => void;
}

export const AddBookView: React.FC<AddBookViewProps> = ({ onAdd, onCancel }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [coverPreview, setCoverPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author) return;
    onAdd(title, author, coverPreview);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button onClick={onCancel} className="p-2 -ml-2 text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold ml-2">New Book Chat</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* Cover Upload */}
        <div className="flex flex-col items-center">
            <div className="relative group cursor-pointer">
                <div className={`w-32 h-44 rounded-lg flex items-center justify-center border-2 border-dashed transition-colors ${coverPreview ? 'border-transparent' : 'border-gray-300 bg-gray-50'}`}>
                    {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover rounded-lg shadow-md" />
                    ) : (
                        <div className="text-center p-4">
                            <ImageIcon className="mx-auto text-gray-400 mb-2" size={32} />
                            <span className="text-xs text-gray-400">Add Cover</span>
                        </div>
                    )}
                </div>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        </div>

        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Book Title</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Enter book title"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#FEE500] transition"
                    required
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                <input 
                    type="text" 
                    value={author}
                    onChange={e => setAuthor(e.target.value)}
                    placeholder="Enter author name"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#FEE500] transition"
                    required
                />
            </div>
        </div>
        
        <div className="pt-8">
            <button 
                type="submit"
                disabled={!title || !author}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-transform active:scale-95 shadow-sm
                    ${(!title || !author) ? 'bg-gray-200 text-gray-400' : 'bg-[#FEE500] text-black hover:bg-[#fdd835]'}`}
            >
                Start Reading Log
            </button>
        </div>
      </form>
    </div>
  );
};