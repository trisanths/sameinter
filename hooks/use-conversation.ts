"use client"

import { useState, useCallback } from "react"
import { saveMessage, getConversation, createConversation } from "@/lib/conversation-utils"
import type { ConversationData, MessageData } from "@/lib/conversation-utils"

export function useConversation() {
  const [currentConversation, setCurrentConversation] = useState<ConversationData | null>(null)
  const [messages, setMessages] = useState<MessageData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true)
      const { conversation, messages: loadedMessages } = await getConversation(conversationId)
      setCurrentConversation(conversation)
      setMessages(loadedMessages)
      console.log("Loaded conversation:", conversation.id, "with", loadedMessages.length, "messages")
    } catch (error) {
      console.error("Failed to load conversation:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createNewConversation = useCallback(
    async (
      title: string,
      initialPrompt?: string,
      canvasState?: { files: Record<string, { content: string; language: string }>; activeFile?: string },
    ) => {
      try {
        setIsLoading(true)
        const { conversation } = await createConversation(title, initialPrompt, canvasState)
        setCurrentConversation(conversation)

        // If there was an initial prompt, add it to messages
        if (initialPrompt) {
          const userMessage: MessageData = {
            id: `temp-${Date.now()}`, // Temporary ID
            conversationId: conversation.id,
            role: "user",
            content: initialPrompt,
            toolInvocations: [],
            createdAt: new Date().toISOString(),
          }
          setMessages([userMessage])
        } else {
          setMessages([])
        }

        console.log("Created new conversation:", conversation.id)
        return conversation
      } catch (error) {
        console.error("Failed to create conversation:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const addMessage = useCallback(
    async (role: "user" | "assistant", content: string, toolInvocations?: any[]) => {
      if (!currentConversation) {
        console.error("No current conversation to add message to")
        return
      }

      try {
        // Add message optimistically to UI
        const tempMessage: MessageData = {
          id: `temp-${Date.now()}`,
          conversationId: currentConversation.id,
          role,
          content,
          toolInvocations: toolInvocations || [],
          createdAt: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, tempMessage])

        // Save to database
        const savedMessage = await saveMessage(currentConversation.id, role, content, toolInvocations)

        // Replace temp message with saved message
        setMessages((prev) => prev.map((msg) => (msg.id === tempMessage.id ? savedMessage : msg)))

        console.log("Added message:", savedMessage.id, "to conversation:", currentConversation.id)
        return savedMessage
      } catch (error) {
        console.error("Failed to add message:", error)
        // Remove the optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== `temp-${Date.now()}`))
        throw error
      }
    },
    [currentConversation],
  )

  return {
    currentConversation,
    messages,
    isLoading,
    loadConversation,
    createNewConversation,
    addMessage,
    setCurrentConversation,
    setMessages,
  }
}
