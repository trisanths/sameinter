"use client"

import { useState, useCallback, useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Copy, Save, Play, Eye, EyeOff } from "lucide-react"

interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  language: string
  fileName: string
  hasResult?: boolean
  onSave?: () => void
  onPreviewToggle?: (show: boolean) => void
  showPreview?: boolean
}

export function CodeEditor({
  code,
  onChange,
  language,
  fileName,
  onSave,
  onPreviewToggle,
  showPreview = false,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false)

  const canPreview = useMemo(() => {
    const previewableLanguages = ["python", "html", "css", "javascript", "typescript", "jsx", "tsx"]
    return (
      previewableLanguages.includes(language.toLowerCase()) ||
      fileName.endsWith(".py") ||
      fileName.endsWith(".html") ||
      fileName.endsWith(".css") ||
      fileName.endsWith(".js") ||
      fileName.endsWith(".ts") ||
      fileName.endsWith(".jsx") ||
      fileName.endsWith(".tsx")
    )
  }, [language, fileName])

  const getPreviewIcon = () => {
    if (language === "python" || fileName.endsWith(".py")) {
      return <Play className="h-3 w-3" />
    }
    return showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />
  }

  const getPreviewText = () => {
    if (language === "python" || fileName.endsWith(".py")) {
      return showPreview ? "Hide Output" : "Run Code"
    }
    return showPreview ? "Hide Preview" : "Show Preview"
  }

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }, [code])

  const handleSave = useCallback(() => {
    onSave?.()
  }, [onSave])

  const handlePreviewToggle = useCallback(() => {
    onPreviewToggle?.(!showPreview)
  }, [onPreviewToggle, showPreview])

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-2 border-b border-border bg-secondary/30">
        <span className="text-sm font-mono text-muted-foreground">{fileName}</span>
        <div className="flex items-center gap-1">
          {canPreview && (
            <Button variant="ghost" size="sm" onClick={handlePreviewToggle}>
              {getPreviewIcon()}
              {getPreviewText()}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy className="h-3 w-3" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          {onSave && (
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="h-3 w-3" />
              Save
            </Button>
          )}
        </div>
      </div>

      <Textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm resize-none border-0 rounded-none focus-visible:ring-0"
        placeholder={`Enter your ${language} code here...`}
      />
    </div>
  )
}
