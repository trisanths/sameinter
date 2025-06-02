"use client"

import { useEffect, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NextJSRuntime } from "@/lib/nextjs-runtime"

interface NextJSPreviewProps {
  fileSystem?: Record<string, { content: string; language: string }>
  currentRoute?: string
  onRouteChange?: (route: string) => void
  onRefresh?: () => void
  viewport?: "desktop" | "tablet" | "mobile"
  onViewportChange?: (viewport: "desktop" | "tablet" | "mobile") => void
}

export function NextjsPreview({
  fileSystem = {},
  currentRoute = "/",
  onRouteChange = () => {},
  onRefresh = () => {},
  viewport = "desktop",
  onViewportChange = () => {},
}: NextJSPreviewProps) {
  const [runtime] = useState(() => NextJSRuntime.getInstance())
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const setupRuntime = async () => {
      try {
        setIsLoading(true)
        console.log("NextJS Preview: Setting up runtime with files:", Object.keys(fileSystem || {}))

        if (!fileSystem || Object.keys(fileSystem).length === 0) {
          setError("No files provided")
          setIsLoading(false)
          return
        }

        // Convert files to the expected format
        const formattedFiles: Record<string, { content: string; language: string }> = {}
        Object.entries(fileSystem).forEach(([path, content]) => {
          if (typeof content === "string") {
            formattedFiles[path] = {
              content: content,
              language: path.endsWith(".tsx") || path.endsWith(".ts") ? "tsx" : "jsx",
            }
          } else {
            formattedFiles[path] = {
              content: content.content || "",
              language: content.language || (path.endsWith(".tsx") || path.endsWith(".ts") ? "tsx" : "jsx"),
            }
          }
        })

        await runtime.setFileSystem(formattedFiles)

        // Force a render attempt
        const result = runtime.renderApp(currentRoute)
        console.log("NextJS Preview: Render result:", result)

        if (result.error) {
          setError(result.error)
        } else if (result.component) {
          setError(null)
          // Force a re-render
          setKey((prev) => prev + 1)
        } else {
          setError("No component returned from runtime")
        }
      } catch (err: any) {
        console.error("NextJS Preview: Setup error:", err)
        setError(`Setup error: ${err.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    if (fileSystem && Object.keys(fileSystem).length > 0) {
      setupRuntime()
    } else {
      setIsLoading(false)
    }
  }, [fileSystem, runtime, currentRoute])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span>Loading preview...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-950">
        <div className="text-center p-6">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Render Error</h3>
          </div>
          <p className="text-sm text-red-600 dark:text-red-400 mb-4 max-w-md">{error}</p>
          <Button
            onClick={() => {
              setError(null)
              setKey((prev) => prev + 1)
              onRefresh()
            }}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Get the component from runtime
  const result = runtime.renderApp(currentRoute)
  if (result.component) {
    const Component = result.component
    return (
      <div key={key} className="h-full p-4">
        <Component />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">No Preview Available</p>
        <p className="text-sm">No valid React component found in the provided files</p>
      </div>
    </div>
  )
}
