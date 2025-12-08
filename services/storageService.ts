import { Book, Message, ReadingStatus, MessageType } from '../types';

const BOOKS_KEY = 'booktalk_books';
const MESSAGES_KEY = 'booktalk_messages';

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

export const deleteBookData = (bookId: string) => {
  const books = getBooks().filter(b => b.id !== bookId);
  saveBooks(books);
  localStorage.removeItem(`${MESSAGES_KEY}_${bookId}`);
}

// Initial seed if empty
export const seedInitialData = () => {
  const books = getBooks();
  if (books.length === 0) {
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
};