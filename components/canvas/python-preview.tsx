"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Square, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface PythonPreviewProps {
  code: string
  className?: string
}

export function PythonPreview({ code, className }: PythonPreviewProps) {
  const [output, setOutput] = useState<string>("")
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runCode = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    setOutput("")

    try {
      setOutput(
        "Python execution is not available in the browser environment.\n\nTo run Python code:\n1. Copy the code\n2. Run it in a local Python environment\n3. Or use an online Python interpreter",
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsRunning(false)
    }
  }, [code])

  const clearOutput = useCallback(() => {
    setOutput("")
    setError(null)
  }, [])

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="border-b border-border p-2 bg-secondary/10 flex items-center justify-between">
        <span className="text-sm font-medium">Python Output</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={clearOutput} disabled={isRunning} className="h-7 px-2">
            <RotateCcw className="h-3 w-3 mr-1" />
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={runCode} disabled={isRunning} className="h-7 px-2">
            {isRunning ? (
              <>
                <Square className="h-3 w-3 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1" />
                Run
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <div className="text-sm text-destructive font-medium mb-1">Error</div>
            <pre className="text-sm text-destructive/80 whitespace-pre-wrap">{error}</pre>
          </div>
        ) : output ? (
          <pre className="text-sm font-mono whitespace-pre-wrap text-foreground">{output}</pre>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Ready to Run</p>
            <p className="text-sm">Click the Run button to execute the Python code</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
