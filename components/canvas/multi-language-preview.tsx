"use client"

import { memo, useMemo } from "react"
import { FileCode, AlertTriangle } from "lucide-react"
import { ReactPreview } from "./react-preview"
import { HtmlPreview } from "./html-preview"
import { CssPreview } from "./css-preview"
import { PythonPreview } from "./python-preview"

interface MultiLanguagePreviewProps {
  fileSystem: Record<string, { content: string; language: string }>
  activeFile?: string
}

export const MultiLanguagePreview = memo(function MultiLanguagePreview({
  fileSystem,
  activeFile,
}: MultiLanguagePreviewProps) {
  const safeFileSystem = fileSystem || {}
  const fileKeys = Object.keys(safeFileSystem)

  const previewType = useMemo(() => {
    // If no active file specified, try to find a suitable default
    let targetFile = activeFile
    if (!targetFile && fileKeys.length > 0) {
      // Look for common entry points
      targetFile =
        fileKeys.find(
          (key) => key.includes("page.") || key.includes("index.") || key.includes("main.") || key.includes("app."),
        ) || fileKeys[0]
    }

    if (!targetFile || !safeFileSystem[targetFile]) {
      console.log("MultiLanguagePreview: No valid target file found")
      return null
    }

    const file = safeFileSystem[targetFile]
    const language = file.language?.toLowerCase() || ""
    const filename = targetFile.toLowerCase()

    console.log("MultiLanguagePreview: Determining preview type for:", {
      targetFile,
      language,
      filename,
      file,
    })

    // Determine preview type based on file extension and language
    if (filename.endsWith(".py") || language === "python") return "python"
    if (filename.endsWith(".html") || language === "html") return "html"
    if (filename.endsWith(".css") || language === "css") return "css"
    if (
      filename.endsWith(".tsx") ||
      filename.endsWith(".jsx") ||
      language === "tsx" ||
      language === "jsx" ||
      language === "typescript" ||
      language === "javascript"
    ) {
      return "react"
    }

    return null
  }, [activeFile, safeFileSystem, fileKeys])

  console.log("MultiLanguagePreview received:", {
    fileSystem,
    activeFile,
    fileSystemType: typeof fileSystem,
    isNull: fileSystem === null,
    isUndefined: fileSystem === undefined,
  })

  console.log("MultiLanguagePreview safe processing:", {
    safeFileSystem,
    fileKeys,
    fileCount: fileKeys.length,
  })

  // Handle empty file system
  if (fileKeys.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No Files Available</p>
          <p className="text-sm">No files provided for preview</p>
        </div>
      </div>
    )
  }

  // Handle unsupported file types
  if (!previewType) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Preview Not Available</p>
          <p className="text-sm">This file type is not supported for preview</p>
          <p className="text-xs mt-2 text-muted-foreground">
            Supported: React (.tsx, .jsx), Python (.py), HTML (.html), CSS (.css)
          </p>
        </div>
      </div>
    )
  }

  // Render the appropriate preview component
  try {
    switch (previewType) {
      case "python":
        const pythonFile =
          activeFile && safeFileSystem[activeFile] ? safeFileSystem[activeFile] : Object.values(safeFileSystem)[0]
        return <PythonPreview code={pythonFile.content} />

      case "html":
        const htmlFile =
          activeFile && safeFileSystem[activeFile] ? safeFileSystem[activeFile] : Object.values(safeFileSystem)[0]
        return <HtmlPreview code={htmlFile.content} />

      case "css":
        const cssFile =
          activeFile && safeFileSystem[activeFile] ? safeFileSystem[activeFile] : Object.values(safeFileSystem)[0]
        return <CssPreview code={cssFile.content} fileSystem={safeFileSystem} />

      case "react":
        return <ReactPreview fileSystem={safeFileSystem} activeFile={activeFile} />

      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Unknown Preview Type</p>
              <p className="text-sm">Unable to determine how to preview this file</p>
            </div>
          </div>
        )
    }
  } catch (error) {
    console.error("Error rendering preview:", error)
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Preview Error</p>
          <p className="text-sm">An error occurred while rendering the preview</p>
          <p className="text-xs mt-2 text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    )
  }
})
