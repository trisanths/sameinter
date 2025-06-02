"use client"

import type React from "react"

import { memo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Search, MessageSquare, ChevronLeft } from "lucide-react"
import type { Conversation } from "@/lib/db/schema"
import { Input } from "@/components/ui/input"

interface ConversationListProps {
  selectedConversationId?: string
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  conversations: Conversation[]
}

export const ConversationList = memo(function ConversationList({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isCollapsed = false,
  onToggleCollapse,
  conversations = [],
}: ConversationListProps) {
  const handleDeleteConversation = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this conversation?")) {
      onDeleteConversation(conversationId)
    }
  }

  if (isCollapsed) {
    return (
      <div className="w-16 sidebar flex flex-col h-full">
        <div className="p-3 flex justify-center">
          <Button
            onClick={onNewConversation}
            size="icon"
            variant="ghost"
            className="h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {conversations.slice(0, 8).map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? "secondary" : "ghost"}
                className="w-10 h-10 p-0 rounded-full"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary"
            onClick={onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 sidebar flex flex-col h-full">
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          size="sm"
          className="w-full bg-secondary hover:bg-secondary/80 text-foreground flex items-center gap-2 h-10"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats"
            className="pl-9 bg-secondary/50 border-0 h-9 text-sm focus-visible:ring-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-px">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedConversationId === conversation.id ? "secondary" : "ghost"}
                className={`w-full justify-start text-left h-auto py-3 px-3 rounded-md ${
                  selectedConversationId === conversation.id ? "bg-secondary" : "hover:bg-secondary/50"
                }`}
                onClick={() => onSelectConversation(conversation.id)}
              >
                <div className="flex items-center gap-2 w-full min-w-0">
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 truncate">
                    <div className="truncate text-sm">{conversation.title}</div>
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-secondary/50 hover:bg-secondary"
          onClick={onToggleCollapse}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
})
