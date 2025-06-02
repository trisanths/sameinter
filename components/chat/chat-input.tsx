"use client"

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Square, ChevronUp, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void
  onStop: () => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSendMessage, onStop, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    if ((input.trim() || selectedFile) && !isLoading) {
      onSendMessage(input.trim(), selectedFile || undefined)
      setInput("")
      setSelectedFile(null)
      setPreviewUrl(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }, [input, selectedFile, isLoading, onSendMessage])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const textarea = e.target
    textarea.style.height = "auto"
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)

      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = () => {
          setPreviewUrl(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-8">
      <div className="relative">
        {previewUrl && (
          <div className="mb-2 relative">
            <div className="relative inline-block">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="Preview"
                className="max-h-32 rounded-md object-contain border border-border"
              />
              <Button
                onClick={removeSelectedFile}
                size="icon"
                variant="secondary"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              >
                <span className="sr-only">Remove</span>
                <span aria-hidden="true">&times;</span>
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-secondary/50 border-border overflow-hidden">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="How can DevChat help you today?"
            disabled={disabled || isLoading}
            className="chat-input min-h-[56px] max-h-[200px] py-4 px-4 pr-16"
            rows={1}
          />
          <div className="absolute right-2 bottom-2 flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <Button
              onClick={triggerFileInput}
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground"
              title="Attach image"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>

            {isLoading ? (
              <Button onClick={onStop} size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-muted-foreground">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={(!input.trim() && !selectedFile) || disabled}
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-lg bg-foreground text-background hover:bg-foreground/90",
                  !input.trim() && !selectedFile && "opacity-50",
                )}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="absolute -bottom-6 left-0 right-0 flex justify-center">
          <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground gap-1 rounded-full px-2">
            <ChevronUp className="h-3 w-3" />
            <span>Model: DevChat</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
