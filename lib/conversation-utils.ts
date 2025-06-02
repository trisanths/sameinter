"use client"

export interface ConversationData {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  canvasState?: {
    files: Record<string, { content: string; language: string }>
    activeFile?: string
  } | null
}

export interface MessageData {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  toolInvocations: any[]
  createdAt: string
}

export async function createConversation(
  title: string,
  initialPrompt?: string,
  canvasState?: { files: Record<string, { content: string; language: string }>; activeFile?: string },
): Promise<ConversationData> {
  const response = await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title,
      initialPrompt,
      canvasState,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create conversation")
  }

  return response.json()
}

export async function getConversation(id: string): Promise<{
  conversation: ConversationData
  messages: MessageData[]
}> {
  const response = await fetch(`/api/conversations/${id}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch conversation")
  }

  return response.json()
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
  toolInvocations?: any[],
): Promise<MessageData> {
  const response = await fetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      role,
      content,
      toolInvocations,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to save message")
  }

  return response.json()
}

export async function updateCanvasState(
  conversationId: string,
  canvasState: { files: Record<string, { content: string; language: string }>; activeFile?: string },
): Promise<void> {
  const response = await fetch(`/api/conversations/${conversationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      canvasState,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update canvas state")
  }
}

export async function getConversations(): Promise<ConversationData[]> {
  const response = await fetch("/api/conversations")

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch conversations")
  }

  return response.json()
}

export async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to delete conversation")
  }
}
