import { supabase } from './supabaseClient';
import { Book, Message, ReadingStatus, MessageType, UserProfile } from '../types';

// Helper to check if we are in cloud mode
const isCloud = !!supabase;

// --- User / Auth ---

export const getCurrentUser = async () => {
    if (isCloud) {
        const { data: { user } } = await supabase!.auth.getUser();
        return user;
    } else {
        // Local Mock User
        const localUserStr = localStorage.getItem('booktalk_user_session');
        return localUserStr ? JSON.parse(localUserStr) : null;
    }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    if (isCloud) {
        const { data, error } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error || !data) return null;

        return {
            name: data.name,
            joinedAt: data.joined_at,
            avatarUrl: data.avatar_url
        };
    } else {
        // Local Profile
        const profileStr = localStorage.getItem('booktalk_user_profile');
        return profileStr ? JSON.parse(profileStr) : null;
    }
};

export const saveUserProfile = async (profile: UserProfile) => {
    const user = await getCurrentUser();
    
    // For local mode login simulation
    if (!user && !isCloud) {
        const mockUser = { id: 'local-user-' + Date.now(), email: 'demo@local.com' };
        localStorage.setItem('booktalk_user_session', JSON.stringify(mockUser));
        localStorage.setItem('booktalk_user_profile', JSON.stringify(profile));
        return;
    }

    if (!user) throw new Error("No user logged in");

    if (isCloud) {
        // Use upsert to handle both insert and update safely
        const { error } = await supabase!.from('profiles').upsert({
            id: user.id,
            name: profile.name,
            joined_at: profile.joinedAt,
            avatar_url: profile.avatarUrl
        }, { onConflict: 'id' });

        if (error) throw error;
    } else {
        localStorage.setItem('booktalk_user_profile', JSON.stringify(profile));
    }
};

// --- Books ---

export const getBooks = async (): Promise<Book[]> => {
    if (isCloud) {
        const { data, error } = await supabase!
            .from('books')
            .select('*')
            .order('last_message_time', { ascending: false });

        if (error) {
            console.error("Error fetching books:", error);
            return [];
        }

        return data.map((b: any) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            coverUrl: b.cover_url,
            status: b.status as ReadingStatus,
            rating: b.rating,
            lastMessage: b.last_message,
            lastMessageTime: b.last_message_time,
            addedAt: b.added_at,
            summary: b.summary
        }));
    } else {
        const booksStr = localStorage.getItem('booktalk_books');
        return booksStr ? JSON.parse(booksStr) : [];
    }
};

export const saveBook = async (book: Book) => {
    if (isCloud) {
        const user = await getCurrentUser();
        if (!user) throw new Error("User not logged in");

        const { error } = await supabase!.from('books').upsert({
            id: book.id,
            user_id: user.id,
            title: book.title,
            author: book.author,
            cover_url: book.coverUrl,
            status: book.status,
            rating: book.rating,
            added_at: book.addedAt,
            last_message: book.lastMessage,
            last_message_time: book.lastMessageTime,
            summary: book.summary
        });

        if (error) throw error;
    } else {
        const books = await getBooks();
        const existingIndex = books.findIndex(b => b.id === book.id);
        if (existingIndex >= 0) {
            books[existingIndex] = book;
        } else {
            books.push(book);
        }
        localStorage.setItem('booktalk_books', JSON.stringify(books));
    }
};

// --- Messages ---

export const getMessages = async (bookId: string): Promise<Message[]> => {
    if (isCloud) {
        const { data, error } = await supabase!
            .from('messages')
            .select('*')
            .eq('book_id', bookId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return [];
        }

        return data.map((m: any) => ({
            id: m.id,
            bookId: m.book_id,
            text: m.text,
            type: m.type as MessageType,
            timestamp: m.timestamp,
            sender: m.sender as 'user' | 'book',
            page: m.page,
            thought: m.thought,
            keywords: m.keywords
        }));
    } else {
        const key = `booktalk_messages_${bookId}`;
        const msgsStr = localStorage.getItem(key);
        return msgsStr ? JSON.parse(msgsStr) : [];
    }
};

export const addMessage = async (message: Message) => {
    if (isCloud) {
        const user = await getCurrentUser();
        if (!user) throw new Error("User not logged in");

        const { error } = await supabase!.from('messages').insert({
            id: message.id,
            book_id: message.bookId,
            user_id: user.id,
            text: message.text,
            type: message.type,
            sender: message.sender,
            timestamp: message.timestamp,
            page: message.page,
            thought: message.thought,
            keywords: message.keywords
        });

        if (error) throw error;
    } else {
        const messages = await getMessages(message.bookId);
        messages.push(message);
        localStorage.setItem(`booktalk_messages_${message.bookId}`, JSON.stringify(messages));
    }
};

export const updateMessage = async (messageId: string, updates: Partial<Message>) => {
    if (isCloud) {
        const dbUpdates: any = {};
        if (updates.keywords) dbUpdates.keywords = updates.keywords;
        if (updates.text) dbUpdates.text = updates.text;
        
        if (Object.keys(dbUpdates).length === 0) return;

        const { error } = await supabase!
            .from('messages')
            .update(dbUpdates)
            .eq('id', messageId);
            
        if (error) throw error;
    } else {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('booktalk_messages_')) {
                const msgs: Message[] = JSON.parse(localStorage.getItem(key)!);
                const targetIndex = msgs.findIndex(m => m.id === messageId);
                if (targetIndex !== -1) {
                    msgs[targetIndex] = { ...msgs[targetIndex], ...updates };
                    localStorage.setItem(key, JSON.stringify(msgs));
                    break;
                }
            }
        }
    }
};