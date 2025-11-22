import { FunctionDeclaration, Tool } from "@google/genai";

export type Role = 'user' | 'model';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
  agentId?: string; // The agent that handled this message
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface Attachment {
  name: string;
  contentType: string;
  content: string; // Base64 for images, text string for text files
  size: number;
}

export type AgentId = 'generalist' | 'researcher' | 'coder' | 'analyst' | 'carSpecialist';

export interface Agent {
  id: AgentId;
  name: string;
  description: string;
  systemInstruction: string;
  tools?: Tool[];
  executableFunctions?: Record<string, (args: any) => Promise<any>>;
  color: string;
}