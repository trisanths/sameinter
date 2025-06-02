"use client"

import { memo, useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Play, Eye, User, Bot, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

interface MessageProps {
  message: {
    id: string
    role: "user" | "assistant" | "system"
    content: string
    createdAt: string
    toolInvocations?: any[]
    imageUrl?: string
  }
  onRunCode?: (code: string, language: string) => void
  onOpenCanvas?: (code: string, language: string, title?: string) => void
}

export const EnhancedMessage = memo(function EnhancedMessage({ message, onRunCode, onOpenCanvas }: MessageProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }, [])

  const isUser = message.role === "user"
  const isSystem = message.role === "system"

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const CodeBlock = ({ language, value }: { language: string; value: string }) => {
    const canRun = ["python", "javascript", "typescript"].includes(language?.toLowerCase())
    const canPreview = ["jsx", "tsx", "javascript", "typescript"].includes(language?.toLowerCase())

    return (
      <div className="relative group">
        <div className="flex items-center justify-between bg-secondary/50 px-4 py-2 border-b border-border">
          <Badge variant="outline" className="text-xs">
            {language}
          </Badge>
          <div className="flex items-center gap-2">
            {canRun && onRunCode && (
              <Button variant="ghost" size="sm" onClick={() => onRunCode(value, language)} className="h-7 px-2 text-xs">
                <Play className="h-3 w-3 mr-1" />
                Run
              </Button>
            )}
            {canPreview && onOpenCanvas && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenCanvas(value, language)}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => handleCopyCode(value)} className="h-7 px-2 text-xs">
              <Copy className="h-3 w-3 mr-1" />
              {copiedCode === value ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            borderRadius: "0 0 0.5rem 0.5rem",
            fontSize: "0.875rem",
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-4 group", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
            isSystem && "bg-muted text-muted-foreground",
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      </div>

      <div className={cn("flex-1 min-w-0", isUser ? "text-right" : "text-left")}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">{isUser ? "You" : isSystem ? "System" : "Assistant"}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(message.createdAt)}
          </div>
        </div>

        <div
          className={cn(
            "rounded-lg px-4 py-3 prose prose-sm max-w-none",
            isUser ? "bg-primary text-primary-foreground ml-8" : "bg-secondary/50 text-foreground mr-8",
            "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
            "prose-code:text-foreground prose-pre:bg-transparent prose-pre:p-0",
          )}
        >
          {message.imageUrl && (
            <div className="mb-3">
              <img
                src={message.imageUrl || "/placeholder.svg"}
                alt="Uploaded image"
                className="max-w-full h-auto rounded-md border border-border"
              />
            </div>
          )}

          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "")
                const language = match ? match[1] : ""

                if (!inline && language) {
                  return <CodeBlock language={language} value={String(children).replace(/\n$/, "")} />
                }

                return (
                  <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono" {...props}>
                    {children}
                  </code>
                )
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse border border-border">{children}</table>
                  </div>
                )
              },
              th({ children }) {
                return <th className="border border-border px-3 py-2 bg-muted font-medium">{children}</th>
              },
              td({ children }) {
                return <td className="border border-border px-3 py-2">{children}</td>
              },
            }}
          >
            {message.content}
          </ReactMarkdown>

          {message.toolInvocations && message.toolInvocations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground mb-2">Tool Invocations:</div>
              <div className="space-y-2">
                {message.toolInvocations.map((tool, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tool.toolName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
