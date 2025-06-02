"use client"

import { useMemo } from "react"
import { CodeExecutor } from "@/lib/code-executor"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface HtmlPreviewProps {
  code: string
  className?: string
}

export function HtmlPreview({ code, className }: HtmlPreviewProps) {
  const { preview, error } = useMemo(() => {
    const executor = CodeExecutor.getInstance()
    return executor.executeHTML(code)
  }, [code])

  if (error) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="border-b border-border p-2 bg-secondary/10">
          <span className="text-sm font-medium">HTML Preview</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Error:</span>
            </div>
            <pre className="text-sm font-mono whitespace-pre-wrap text-destructive">{error}</pre>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="border-b border-border p-2 bg-secondary/10">
        <span className="text-sm font-medium">HTML Preview</span>
      </div>
      <div className="flex-1 overflow-auto">
        <iframe
          srcDoc={preview}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
          title="HTML Preview"
        />
      </div>
    </div>
  )
}

// Export with the expected name
export { HtmlPreview as HTMLPreview }
