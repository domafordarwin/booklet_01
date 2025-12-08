import { GoogleGenAI, Type } from "@google/genai";
import { Book, Message } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateBookWelcome = async (title: string, author: string): Promise<string> => {
  const client = getClient();
  if (!client) return `Welcome to your reading log for ${title}.`;

  try {
    const prompt = `I am starting to read the book "${title}" by ${author}. Write a short, friendly, 1-sentence welcome message as if you are the book welcoming me to read you. Be charming.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text || `Welcome to ${title}.`;
  } catch (error) {
    console.error("Gemini error:", error);
    return `Welcome to ${title}.`;
  }
};

export const chatWithBook = async (book: Book, history: Message[], userMessage: string): Promise<string> => {
  const client = getClient();
  if (!client) return "I need an API Key to answer that! (Check environment variables)";

  try {
    // Construct simplified history
    // We only take the last 10 messages to keep context relevant but concise
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const systemInstruction = `You are the book "${book.title}" by ${book.author}. 
    Your persona is friendly, knowledgeable, and helpful. 
    You are chatting with a reader who is currently reading you.
    Answer their questions about your plot, characters, themes, or author.
    If they ask for a summary, give a brief one.
    If they share a quote, appreciate it.
    Keep your responses concise (under 100 words) and conversational, like a chat message.`;

    const chat = client.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction },
      history: recentHistory,
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "...";
  } catch (error) {
    console.error("Chat error:", error);
    return "Sorry, I'm having trouble reading the pages right now. Try again later.";
  }
};

export const extractKeywords = async (text: string): Promise<string[]> => {
  const client = getClient();
  if (!client) return [];

  try {
    const prompt = `Analyze this book quote and extract exactly 3 short, relevant keywords or themes (e.g. Love, War, Regret). Return ONLY a JSON array of strings. Quote: "${text}"`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const jsonStr = response.text;
    if (jsonStr) {
        return JSON.parse(jsonStr);
    }
    return [];
  } catch (error) {
    console.error("Keyword extraction error:", error);
    return [];
  }
};