"use client"

import { memo, useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Zap, FileCode, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreamingIndicatorProps {
  isActive: boolean
  currentAgent: string
  currentTask: string
  progress: number
  generatedFiles: string[]
  currentCode?: string
  currentFile?: string
  error?: string
}

export const EnhancedStreamingIndicator = memo(function EnhancedStreamingIndicator({
  isActive,
  currentAgent,
  currentTask,
  progress,
  generatedFiles,
  currentCode,
  currentFile,
  error,
}: StreamingIndicatorProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [isActive])

  if (!isActive && !error && progress < 100) return null

  return (
    <div className="flex justify-start mb-4">
      <div className="glass-effect rounded-xl px-6 py-4 border border-border/50 message-bubble max-w-md">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {error ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : progress >= 100 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-3 w-3 text-primary animate-pulse" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{currentAgent}</span>
              {isActive && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {error ? "Error occurred" : currentTask}
              {isActive && !error && dots}
            </div>
          </div>
        </div>

        {error ? (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
            <div className="text-sm text-destructive font-medium mb-1">Error</div>
            <div className="text-xs text-destructive/80">{error}</div>
          </div>
        ) : (
          <>
            <Progress value={progress} className="mb-3 h-2" />

            {currentFile && currentCode && (
              <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{currentFile}</span>
                </div>
                <div className="text-xs text-muted-foreground font-mono bg-background/50 rounded p-2 max-h-20 overflow-hidden">
                  {currentCode.slice(0, 100)}
                  {currentCode.length > 100 && "..."}
                </div>
              </div>
            )}

            {generatedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Generated Files:</div>
                <div className="flex flex-wrap gap-1">
                  {generatedFiles.map((file, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {file}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
          <div className="text-xs text-muted-foreground">
            {progress >= 100 ? "Complete" : `${Math.round(progress)}%`}
          </div>
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                error
                  ? "bg-destructive"
                  : progress >= 100
                    ? "bg-green-500"
                    : isActive
                      ? "bg-primary animate-pulse"
                      : "bg-muted",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {error ? "Error" : progress >= 100 ? "Done" : isActive ? "Processing" : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
})
