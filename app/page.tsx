"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useChat } from "ai/react"
import { ConversationList } from "@/components/chat/conversation-list"
import { ChatInput } from "@/components/chat/chat-input"
import { CanvasPanel } from "@/components/canvas/canvas-panel"
import { EnhancedMessage } from "@/components/chat/enhanced-message"
import { StatusIndicator } from "@/components/status-indicator"
import { SettingsPanel } from "@/components/settings/settings-panel"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Code2, Zap, PanelRightOpen, PanelRightClose, Terminal, Settings, Brain, Layers, Cpu } from "lucide-react"
import { EnhancedStreamingIndicator } from "@/components/chat/enhanced-streaming-indicator"
import type { Conversation, Message } from "@/lib/db/schema"

interface StreamingState {
  isActive: boolean
  currentAgent: string
  currentTask: string
  progress: number
  generatedFiles: string[]
  currentCode?: string
  currentFile?: string
  error?: string
}

interface CanvasState {
  isOpen: boolean
  code: string
  language: string
  title: string
  files: Record<string, { content: string; language: string }>
}

export default function DevChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string>()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [conversationLoading, setConversationLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [canvasState, setCanvasState] = useState<CanvasState>({
    isOpen: false,
    code: "",
    language: "jsx",
    title: "Canvas",
    files: {},
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, setMessages, append } = useChat({
    api: "/api/agent",
    body: { conversationId: selectedConversationId },
    onToolCall: ({ toolCall }) => {
      setStreamingState({
        isActive: true,
        currentAgent: "AI Developer",
        currentTask: `Creating ${toolCall.toolName}...`,
        progress: 30,
        generatedFiles: [],
        currentCode: toolCall.args.componentCode || "",
        currentFile: toolCall.args.fileName || "",
      })
    },
    onToolResult: ({ toolCall, toolResult }) => {
      if (toolResult?.success) {
        const files: Record<string, { content: string; language: string }> = {}

        if (toolCall.toolName === "createNextJSProject") {
          if (toolResult.mainPageCode) {
            files["app/page.tsx"] = { content: toolResult.mainPageCode, language: "tsx" }
          }
          if (toolResult.additionalFiles) {
            Object.entries(toolResult.additionalFiles).forEach(([path, fileData]: [string, any]) => {
              files[path] = { content: fileData.content, language: fileData.language || "tsx" }
            })
          }
        } else if (toolCall.toolName === "createReactComponent") {
          const fileName = toolResult.fileName || `${toolResult.componentName}.tsx`
          files[fileName] = { content: toolResult.componentCode, language: "tsx" }
        }

        setStreamingState((prev) =>
          prev
            ? {
                ...prev,
                progress: 95,
                generatedFiles: Object.keys(files),
                currentTask: "Generation complete!",
              }
            : null,
        )

        if (Object.keys(files).length > 0) {
          setCanvasState({
            isOpen: true,
            code: Object.values(files)[0].content,
            language: "tsx",
            title: toolResult.projectName || toolResult.componentName || "Project",
            files,
          })
        }
      }
    },
    onFinish: async (message) => {
      setStreamingState((prev) => (prev ? { ...prev, progress: 100, isActive: false } : null))
      setTimeout(() => setStreamingState(null), 2000)

      if (selectedConversationId && message.content) {
        try {
          await fetch(`/api/conversations/${selectedConversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: message.role,
              content: message.content,
              toolInvocations: message.toolInvocations || [],
            }),
          })
        } catch (error) {
          console.error("Failed to save message:", error)
        }
      }

      refreshConversations()

      if (message.content && message.role === "assistant") {
        const codeBlocks = message.content.match(/```(?:tsx?|jsx?|typescript|javascript)\s*\n([\s\S]*?)```/g)

        if (codeBlocks && codeBlocks.length >= 2) {
          const files: Record<string, { content: string; language: string }> = {}

          codeBlocks.forEach((block, index) => {
            const match = block.match(/```(\w+)\s*\n([\s\S]*?)```/)
            if (match) {
              const [, language, code] = match
              const cleanCode = code.trim()

              const componentMatch = cleanCode.match(/(?:export\s+default\s+)?(?:function\s+|const\s+)(\w+)/)
              const componentName = componentMatch?.[1] || `Component${index + 1}`

              const filename = `${componentName}.${language === "typescript" ? "tsx" : "jsx"}`
              files[filename] = {
                content: cleanCode,
                language: language === "typescript" ? "tsx" : "jsx",
              }
            }
          })

          if (Object.keys(files).length >= 2) {
            setTimeout(() => {
              setCanvasState({
                isOpen: true,
                code: Object.values(files)[0].content,
                language: "tsx",
                title: "React Project",
                files,
              })
            }, 1000)
          }
        }
      }

      scrollToBottom()
    },
    onError: (error) => {
      setStreamingState({
        isActive: false,
        currentAgent: "System",
        currentTask: "Error occurred",
        progress: 0,
        generatedFiles: [],
        error: error.message,
      })
    },
  })

  const refreshConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations")
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      } else {
        setConversations([])
      }
    } catch (error) {
      setConversations([])
    } finally {
      setIsInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSelectConversation = useCallback(
    async (conversationId: string) => {
      setSelectedConversationId(conversationId)
      setConversationLoading(true)

      try {
        const response = await fetch(`/api/conversations/${conversationId}`)
        const data = await response.json()

        if (response.ok) {
          if (data.messages && Array.isArray(data.messages)) {
            const chatMessages = data.messages.map((msg: Message) => ({
              id: msg.id,
              role: msg.role as "user" | "assistant" | "system",
              content: msg.content || "",
              createdAt: msg.createdAt,
              toolInvocations: msg.toolInvocations || undefined,
              imageUrl: msg.imageUrl,
            }))
            setMessages(chatMessages)

            let extractedCanvasState: CanvasState | null = null
            for (const message of chatMessages) {
              if (message.toolInvocations) {
                const files: Record<string, { content: string; language: string }> = {}
                let mainCode = ""
                let projectName = "Project"

                for (const toolInvocation of message.toolInvocations) {
                  if (toolInvocation.state === "result" && toolInvocation.result) {
                    const result = toolInvocation.result

                    if (toolInvocation.toolName === "createNextJSProject" && result.success) {
                      if (result.mainPageCode) {
                        files["app/page.tsx"] = { content: result.mainPageCode, language: "tsx" }
                        mainCode = result.mainPageCode
                      }
                      if (result.projectName) projectName = result.projectName
                      if (result.additionalFiles) {
                        Object.entries(result.additionalFiles).forEach(([path, fileData]: [string, any]) => {
                          files[path] = { content: fileData.content, language: fileData.language || "tsx" }
                        })
                      }
                    } else if (toolInvocation.toolName === "createReactComponent" && result.success) {
                      const fileName = result.fileName || `${result.componentName}.tsx`
                      files[fileName] = { content: result.componentCode, language: "tsx" }
                      if (!mainCode) mainCode = result.componentCode
                      if (result.componentName) projectName = result.componentName
                    }
                  }
                }

                if (Object.keys(files).length > 0) {
                  extractedCanvasState = {
                    isOpen: false,
                    code: mainCode,
                    language: "tsx",
                    title: projectName,
                    files,
                  }
                }
              }
            }

            if (extractedCanvasState) {
              setCanvasState(extractedCanvasState)
            } else {
              setCanvasState({
                isOpen: false,
                code: "",
                language: "jsx",
                title: "Canvas",
                files: {},
              })
            }
          } else {
            setMessages([])
            setCanvasState({
              isOpen: false,
              code: "",
              language: "jsx",
              title: "Canvas",
              files: {},
            })
          }
        } else {
          setMessages([])
          setCanvasState({
            isOpen: false,
            code: "",
            language: "jsx",
            title: "Canvas",
            files: {},
          })
        }
      } catch (error) {
        setMessages([])
        setCanvasState({
          isOpen: false,
          code: "",
          language: "jsx",
          title: "Canvas",
          files: {},
        })
      } finally {
        setConversationLoading(false)
        setTimeout(scrollToBottom, 100)
      }
    },
    [setMessages, scrollToBottom],
  )

  const handleNewConversation = useCallback(() => {
    setSelectedConversationId(undefined)
    setMessages([])
    setStreamingState(null)
    setCanvasState({
      isOpen: false,
      code: "",
      language: "jsx",
      title: "Canvas",
      files: {},
    })
  }, [setMessages])

  const handleSendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!content.trim() && !file) return

      let conversationId = selectedConversationId
      let imageUrl = null

      if (file && file.type.startsWith("image/")) {
        try {
          const formData = new FormData()
          formData.append("file", file)

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            imageUrl = uploadResult.url
          }
        } catch (error) {
          console.error("Failed to upload image:", error)
        }
      }

      if (!conversationId) {
        try {
          const response = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: content.slice(0, 50) || "New Conversation",
            }),
          })

          if (response.ok) {
            const conversation = await response.json()
            conversationId = conversation.id
            setSelectedConversationId(conversationId)
            refreshConversations()
          }
        } catch (error) {
          console.error("Failed to create conversation:", error)
        }
      }

      if (conversationId) {
        try {
          await fetch(`/api/conversations/${conversationId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              role: "user",
              content: content,
              toolInvocations: [],
              imageUrl: imageUrl,
            }),
          })
        } catch (error) {
          console.error("Failed to save user message:", error)
        }
      }

      await append({
        role: "user",
        content,
        imageUrl,
      })

      scrollToBottom()
    },
    [selectedConversationId, append, refreshConversations, scrollToBottom],
  )

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          if (selectedConversationId === conversationId) {
            handleNewConversation()
          }
          refreshConversations()
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error)
      }
    },
    [selectedConversationId, handleNewConversation, refreshConversations],
  )

  const handleRunCode = useCallback((code: string, language: string) => {
    setCanvasState({
      isOpen: true,
      code,
      language,
      title: `${language.toUpperCase()} Execution`,
      files: { [`main.${language}`]: { content: code, language } },
    })
  }, [])

  const handleOpenCanvas = useCallback((code: string, language: string, title?: string) => {
    setCanvasState({
      isOpen: true,
      code,
      language,
      title: title || "Canvas",
      files: { [`main.${language}`]: { content: code, language } },
    })
  }, [])

  const EmptyState = useMemo(
    () => (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground p-8">
        <div className="text-center max-w-2xl">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-border/50 glass-effect">
                <Code2 className="h-12 w-12 text-primary" />
              </div>
              <div className="absolute -top-2 -right-2 h-8 w-8 dev-gradient rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <h3 className="text-4xl font-bold mb-4 text-foreground">
            <span className="dev-gradient bg-clip-text text-transparent">DevChat</span>
          </h3>
          <p className="text-muted-foreground mb-8 leading-relaxed text-lg">
            AI-powered development companion for building, debugging, and creating with intelligent assistance.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {[
              {
                icon: <Terminal className="h-6 w-6" />,
                title: "React Components",
                desc: "Build interactive UI components with modern patterns",
                color: "from-blue-500/10 to-cyan-500/10",
              },
              {
                icon: <Layers className="h-6 w-6" />,
                title: "Full Stack Apps",
                desc: "Create complete applications with Next.js and TypeScript",
                color: "from-green-500/10 to-emerald-500/10",
              },
              {
                icon: <Brain className="h-6 w-6" />,
                title: "Code Solutions",
                desc: "Solve complex algorithms and programming challenges",
                color: "from-purple-500/10 to-pink-500/10",
              },
              {
                icon: <Cpu className="h-6 w-6" />,
                title: "System Design",
                desc: "Architect scalable systems and optimize performance",
                color: "from-orange-500/10 to-red-500/10",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl bg-gradient-to-br ${item.color} border border-border/30 hover:border-border/60 transition-all duration-300 glass-effect`}
              >
                <div className="text-primary mb-4">{item.icon}</div>
                <p className="font-semibold text-foreground mb-2">{item.title}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    [],
  )

  if (isInitialLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-border/50 glass-effect animate-pulse">
              <Code2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
          <div className="text-sm text-muted-foreground">Initializing DevChat...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="border-b border-border p-4 flex items-center justify-between glass-effect flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg dev-gradient flex items-center justify-center">
                <Code2 className="h-4 w-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">DevChat</h1>
            </div>
            {selectedConversationId && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse status-online" />
                <span>Active Session</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <StatusIndicator />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            {Object.keys(canvasState.files).length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCanvasState((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
                className="flex items-center gap-2 hover:bg-primary/10 hover:text-primary transition-colors"
              >
                {canvasState.isOpen ? (
                  <>
                    <PanelRightClose className="h-4 w-4" />
                    Close Canvas
                  </>
                ) : (
                  <>
                    <PanelRightOpen className="h-4 w-4" />
                    Open Canvas
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 min-h-full">
              <div className="max-w-4xl mx-auto">
                {conversationLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="loading-dots">
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                      <div className="text-sm text-muted-foreground">Loading conversation...</div>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  EmptyState
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <EnhancedMessage
                        key={message.id}
                        message={{
                          ...message,
                          content: message.content || "",
                          createdAt:
                            typeof message.createdAt === "string"
                              ? message.createdAt
                              : new Date(message.createdAt).toISOString(),
                          imageUrl: message.imageUrl,
                        }}
                        onRunCode={handleRunCode}
                        onOpenCanvas={handleOpenCanvas}
                      />
                    ))}

                    {streamingState && (
                      <EnhancedStreamingIndicator
                        isActive={streamingState.isActive}
                        currentAgent={streamingState.currentAgent}
                        currentTask={streamingState.currentTask}
                        progress={streamingState.progress}
                        generatedFiles={streamingState.generatedFiles}
                        currentCode={streamingState.currentCode}
                        currentFile={streamingState.currentFile}
                        error={streamingState.error}
                      />
                    )}

                    {isLoading && !streamingState?.isActive && (
                      <div className="flex justify-start mb-4">
                        <div className="glass-effect rounded-xl px-6 py-4 border border-border/50 message-bubble">
                          <div className="flex items-center space-x-3">
                            <div className="loading-dots">
                              <div></div>
                              <div></div>
                              <div></div>
                            </div>
                            <span className="text-sm text-muted-foreground">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        <ChatInput onSendMessage={handleSendMessage} onStop={stop} isLoading={isLoading} />
      </div>

      <CanvasPanel
        isOpen={canvasState.isOpen}
        onClose={() => setCanvasState((prev) => ({ ...prev, isOpen: false }))}
        initialCode={canvasState.code}
        language={canvasState.language}
        title={canvasState.title}
        files={canvasState.files}
      />

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
