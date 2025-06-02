"use client"

import { useState, memo } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronRight, ChevronDown, Folder, FolderOpen, Plus, FileText, Code, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  content?: string
  language?: string
  path: string // Add path property
}

interface FileExplorerProps {
  files: FileNode[]
  onFileSelect: (file: FileNode) => void // Simplified to just pass the FileNode
  selectedFilePath?: string // Change from selectedFile to selectedFilePath
  onCreateFile?: (path: string, type: "file" | "folder") => void
}

export const FileExplorer = memo(function FileExplorer({
  files,
  onFileSelect,
  selectedFilePath, // Updated prop name
  onCreateFile,
}: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["app", "components"]))

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedFolders(newExpanded)
  }

  const getFileIcon = (fileName: string, type: string) => {
    if (type === "folder") {
      return expandedFolders.has(fileName) ? FolderOpen : Folder
    }

    const ext = fileName.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "tsx":
      case "jsx":
      case "ts":
      case "js":
        return Code
      case "png":
      case "jpg":
      case "jpeg":
      case "svg":
        return ImageIcon
      default:
        return FileText
    }
  }

  const renderFileTree = (nodes: FileNode[], basePath = "") => {
    return nodes.map((node) => {
      const fullPath = node.path || (basePath ? `${basePath}/${node.name}` : node.name)
      const Icon = getFileIcon(node.name, node.type)
      const isExpanded = expandedFolders.has(fullPath)
      const isSelected = selectedFilePath === fullPath

      return (
        <div key={fullPath}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-secondary/50 rounded-sm",
              isSelected && "bg-primary/20 text-primary",
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (node.type === "folder") {
                toggleFolder(fullPath)
              } else {
                // Pass the node with the correct path
                onFileSelect({ ...node, path: fullPath })
              }
            }}
            style={{ paddingLeft: `${basePath.split("/").length * 12 + 8}px` }}
          >
            {node.type === "folder" && (
              <div className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </div>
            )}
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>

          {node.type === "folder" && isExpanded && node.children && (
            <div>{renderFileTree(node.children, fullPath)}</div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="w-64 border-r border-border bg-secondary/20 flex flex-col h-full">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium">Explorer</span>
        {onCreateFile && (
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-1">{renderFileTree(files)}</div>
      </ScrollArea>
    </div>
  )
})
