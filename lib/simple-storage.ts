import { v4 as uuidv4 } from "uuid"

interface StoredConversation {
  id: string
  title: string
  initialPrompt?: string
  canvasState?: any
  createdAt: string
  updatedAt: string
}

interface StoredMessage {
  id: string
  conversationId: string
  role: "user" | "assistant" | "system"
  content: string
  toolInvocations?: any[]
  metadata?: any
  imageUrl?: string
  createdAt: string
}

class SimpleStorage {
  private conversations: StoredConversation[] = []
  private messages: StoredMessage[] = []

  constructor() {
    this.load()
  }

  private load() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("devchat-storage")
        if (stored) {
          const data = JSON.parse(stored)
          this.conversations = data.conversations || []
          this.messages = data.messages || []
        }
      } catch (error) {
        console.error("Failed to load from localStorage:", error)
      }
    }
  }

  save() {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "devchat-storage",
          JSON.stringify({
            conversations: this.conversations,
            messages: this.messages,
          }),
        )
      } catch (error) {
        console.error("Failed to save to localStorage:", error)
      }
    }
  }

  getConversations(): StoredConversation[] {
    return this.conversations
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 100)
  }

  getConversation(id: string): (StoredConversation & { messages: StoredMessage[] }) | null {
    const conversation = this.conversations.find((c) => c.id === id)
    if (!conversation) return null

    const conversationMessages = this.messages
      .filter((m) => m.conversationId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return {
      ...conversation,
      messages: conversationMessages,
    }
  }

  createConversation(title: string): StoredConversation {
    const conversation: StoredConversation = {
      id: uuidv4(),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.conversations.push(conversation)
    return conversation
  }

  deleteConversation(id: string): boolean {
    const index = this.conversations.findIndex((c) => c.id === id)
    if (index === -1) return false

    this.conversations.splice(index, 1)
    this.messages = this.messages.filter((m) => m.conversationId !== id)
    return true
  }

  createMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    toolInvocations: any[] = [],
    imageUrl?: string,
  ): StoredMessage | null {
    const conversation = this.conversations.find((c) => c.id === conversationId)
    if (!conversation) return null

    const message: StoredMessage = {
      id: uuidv4(),
      conversationId,
      role,
      content,
      toolInvocations,
      imageUrl,
      createdAt: new Date().toISOString(),
    }

    this.messages.push(message)
    conversation.updatedAt = new Date().toISOString()

    return message
  }
}

export const simpleStorage = new SimpleStorage()
