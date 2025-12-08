export enum ReadingStatus {
  TO_READ = 'TO_READ',
  READING = 'READING',
  COMPLETED = 'COMPLETED',
}

export enum MessageType {
  TEXT = 'TEXT',
  QUOTE = 'QUOTE',
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM',
  AI_RESPONSE = 'AI_RESPONSE', // Message from the "Book" itself
}

export interface Message {
  id: string;
  bookId: string;
  text: string; // The main content (or the quote itself)
  type: MessageType;
  timestamp: number;
  sender: 'user' | 'book';
  
  // New fields for Quote/Note feature
  page?: string;       // e.g. "p. 12" or "12-14"
  thought?: string;    // User's personal feeling/comment on the quote
  keywords?: string[]; // AI generated keywords
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string; // Base64 or URL
  status: ReadingStatus;
  rating: number; // 0-5
  lastMessage?: string;
  lastMessageTime?: number;
  addedAt: number;
  summary?: string;
}

export type ViewMode = 'LIST' | 'CHAT' | 'ADD_BOOK' | 'SETTINGS';

export interface ViewState {
  mode: ViewMode;
  activeBookId?: string;
}