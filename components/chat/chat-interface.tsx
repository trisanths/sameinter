"use client"

import { useState, useCallback, useEffect } from "react"
import { useConversation } from "@/hooks/use-conversation"
import { ChatInput } from "./chat-input"
import { EnhancedMessage } from "./enhanced-message"
import { CanvasPanel } from "../canvas/canvas-panel"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Rocket } from "lucide-react"

interface ChatInterfaceProps {
  conversationId?: string
  onConversationChange?: (conversationId: string) => void
}

export function ChatInterface({ conversationId, onConversationChange }: ChatInterfaceProps) {
  const { currentConversation, messages, loadConversation, createNewConversation, addMessage } = useConversation()
  const [isCanvasOpen, setIsCanvasOpen] = useState(false)
  const [canvasFiles, setCanvasFiles] = useState<
    Record<
      string,
      {
        content: string
        language: string
      }
    >
  >({})
  const [isGenerating, setIsGenerating] = useState(false)

  // Load conversation when conversationId changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    }
  }, [conversationId, loadConversation])

  const handleSendMessage = useCallback(
    async (content: string) => {
      try {
        setIsGenerating(true)

        let conversation = currentConversation

        // Create new conversation if none exists
        if (!conversation) {
          conversation = await createNewConversation("New Chat", content)
          onConversationChange?.(conversation.id)
        } else {
          // Add user message to existing conversation
          await addMessage("user", content)
        }

        // TODO: Here you would typically call your AI service
        // For now, let's simulate an AI response
        setTimeout(async () => {
          try {
            const aiResponse = `I received your message: "${content}". This is a simulated response.`
            await addMessage("assistant", aiResponse)
          } catch (error) {
            console.error("Failed to add AI response:", error)
          } finally {
            setIsGenerating(false)
          }
        }, 1000)
      } catch (error) {
        console.error("Failed to send message:", error)
        setIsGenerating(false)
      }
    },
    [currentConversation, createNewConversation, addMessage, onConversationChange],
  )

  const handleOpenCanvas = useCallback((code: string, language: string, title?: string) => {
    const fileName = `main.${language === "jsx" ? "jsx" : language}`
    setCanvasFiles({
      [fileName]: { content: code, language },
    })
    setIsCanvasOpen(true)
  }, [])

  return (
    <div className="flex flex-col h-full chat-container">
      {/* Empty State */}
      {messages.length === 0 && !isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Rocket className="h-6 w-6 text-foreground" />
          </div>
          <h1 className="text-2xl font-medium mb-2">Welcome to DevChat</h1>
          <p className="text-muted-foreground text-center max-w-md mb-8">
            Your AI-powered development assistant. Ask questions, generate code, and get help with your projects.
          </p>
        </div>
      )}

      {/* Chat Messages */}
      {(messages.length > 0 || isGenerating) && (
        <ScrollArea className="flex-1 py-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <EnhancedMessage key={message.id} message={message} onOpenCanvas={handleOpenCanvas} />
            ))}
            {isGenerating && (
              <div className="w-full max-w-3xl mx-auto px-4 py-6">
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2">
                    <div className="loading-dots">
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <span className="text-sm text-muted-foreground">Generating response...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}

      {/* Chat Input */}
      <div className="border-t border-border py-4">
        <ChatInput onSendMessage={handleSendMessage} onStop={() => setIsGenerating(false)} isLoading={isGenerating} />
      </div>

      {/* Canvas Panel */}
      <CanvasPanel
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        files={canvasFiles}
        title="Generated Code"
      />
    </div>
  )
}
