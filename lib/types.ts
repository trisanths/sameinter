export interface StreamingState {
  isActive: boolean;
  currentAgent: string;
  currentTask: string;
  progress: number;
  generatedFiles: string[];
  currentCode?: string;
  currentFile?: string;
  error?: string;
}

export interface CanvasState {
  isOpen: boolean;
  code: string;
  language: string;
  title: string;
  files: Record<string, { content: string; language: string }>;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  toolInvocations?: any[];
  imageUrl?: string;
}

export interface ToolInvocation {
  id: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "pending" | "running" | "result" | "error";
  result?: unknown;
  error?: string;
}
