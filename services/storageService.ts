import { Book, Message, ReadingStatus, MessageType, UserProfile } from '../types';

const BOOKS_KEY = 'booktalk_books';
const MESSAGES_KEY = 'booktalk_messages';
const PROFILE_KEY = 'booktalk_profile';

export const getBooks = (): Book[] => {
  try {
    const data = localStorage.getItem(BOOKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load books", e);
    return [];
  }
};

export const saveBooks = (books: Book[]) => {
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
};

export const getMessages = (bookId: string): Message[] => {
  try {
    const data = localStorage.getItem(`${MESSAGES_KEY}_${bookId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load messages", e);
    return [];
  }
};

export const saveMessages = (bookId: string, messages: Message[]) => {
  localStorage.setItem(`${MESSAGES_KEY}_${bookId}`, JSON.stringify(messages));
};

export const getUserProfile = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const saveUserProfile = (profile: UserProfile) => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const deleteBookData = (bookId: string) => {
  const books = getBooks().filter(b => b.id !== bookId);
  saveBooks(books);
  localStorage.removeItem(`${MESSAGES_KEY}_${bookId}`);
}

// Initial seed if empty
export const seedInitialData = () => {
  // We no longer auto-seed books on fresh load to allow for "Onboarding" flow to take precedence.
  // Data will be seeded only after user creates a profile if they have no books.
};

export const seedDemoBook = () => {
    const demoId = 'demo-1';
    const initialBook: Book = {
      id: demoId,
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      coverUrl: 'https://picsum.photos/id/24/200/300',
      status: ReadingStatus.READING,
      rating: 0,
      lastMessage: 'Welcome to your reading log for The Great Gatsby.',
      lastMessageTime: Date.now(),
      addedAt: Date.now(),
      summary: 'A story of decadence and excess.',
    };
    const initialMessages: Message[] = [
      {
        id: 'msg-1',
        bookId: demoId,
        text: 'Welcome to your reading log for The Great Gatsby. You can chat with me about the plot!',
        type: MessageType.SYSTEM,
        timestamp: Date.now(),
        sender: 'book'
      }
    ];
    saveBooks([initialBook]);
    saveMessages(demoId, initialMessages);
}

// --- Backup & Restore ---

export interface BackupData {
    version: number;
    timestamp: number;
    profile: UserProfile | null;
    books: Book[];
    messages: Record<string, Message[]>;
}

export const createBackup = (): BackupData => {
    const books = getBooks();
    const profile = getUserProfile();
    const messagesMap: Record<string, Message[]> = {};
    
    books.forEach(book => {
        messagesMap[book.id] = getMessages(book.id);
    });

    return {
        version: 1,
        timestamp: Date.now(),
        profile,
        books,
        messages: messagesMap
    };
};

export const restoreBackup = (data: BackupData) => {
    if (!data.books || !data.messages) {
        throw new Error("Invalid backup file format");
    }

    // Restore Profile if exists in backup
    if (data.profile) {
        saveUserProfile(data.profile);
    }

    // Restore books
    saveBooks(data.books);

    // Restore messages for each book
    Object.keys(data.messages).forEach(bookId => {
        saveMessages(bookId, data.messages[bookId]);
    });
};