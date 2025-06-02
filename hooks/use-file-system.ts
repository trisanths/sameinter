"use client"

import { useState, useCallback, useMemo } from "react"

export interface FileNode {
  name: string
  type: "file" | "folder"
  content?: string
  language?: string
  children?: FileNode[]
  path: string
}

export interface FileSystemState {
  files: FileNode[]
  activeFile: string | null
}

export function useFileSystem() {
  const [fileSystem, setFileSystem] = useState<FileSystemState>({
    files: [],
    activeFile: null,
  })

  const addFile = useCallback((path: string, content = "", language?: string) => {
    setFileSystem((prev) => {
      const pathParts = path.split("/")
      const fileName = pathParts[pathParts.length - 1]
      const newFile: FileNode = {
        name: fileName,
        type: "file",
        content,
        language: language || getLanguageFromExtension(fileName),
        path,
      }

      const newFiles = [...prev.files]
      const existingIndex = newFiles.findIndex((f) => f.path === path)

      if (existingIndex >= 0) {
        newFiles[existingIndex] = newFile
      } else {
        newFiles.push(newFile)
      }

      return {
        ...prev,
        files: newFiles,
        activeFile: path,
      }
    })
  }, [])

  const updateFile = useCallback((path: string, content: string) => {
    setFileSystem((prev) => ({
      ...prev,
      files: prev.files.map((file) => (file.path === path ? { ...file, content } : file)),
    }))
  }, [])

  const deleteFile = useCallback((path: string) => {
    setFileSystem((prev) => ({
      ...prev,
      files: prev.files.filter((file) => file.path !== path),
      activeFile: prev.activeFile === path ? null : prev.activeFile,
    }))
  }, [])

  const setActiveFile = useCallback((path: string | null) => {
    setFileSystem((prev) => ({
      ...prev,
      activeFile: path,
    }))
  }, [])

  const getFile = useCallback(
    (path: string) => {
      return fileSystem.files.find((file) => file.path === path)
    },
    [fileSystem.files],
  )

  const fileTree = useMemo(() => {
    return buildFileTree(fileSystem.files)
  }, [fileSystem.files])

  return {
    files: fileSystem.files,
    activeFile: fileSystem.activeFile,
    fileTree,
    addFile,
    updateFile,
    deleteFile,
    setActiveFile,
    getFile,
  }
}

function getLanguageFromExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "js":
    case "jsx":
      return "javascript"
    case "ts":
    case "tsx":
      return "typescript"
    case "py":
      return "python"
    case "html":
      return "html"
    case "css":
      return "css"
    case "json":
      return "json"
    case "md":
      return "markdown"
    default:
      return "text"
  }
}

function buildFileTree(files: FileNode[]): FileNode[] {
  const tree: FileNode[] = []
  const folderMap = new Map<string, FileNode>()

  // Sort files by path depth and name
  const sortedFiles = [...files].sort((a, b) => {
    const aDepth = a.path.split("/").length
    const bDepth = b.path.split("/").length
    if (aDepth !== bDepth) return aDepth - bDepth
    return a.path.localeCompare(b.path)
  })

  for (const file of sortedFiles) {
    const pathParts = file.path.split("/")

    if (pathParts.length === 1) {
      // Root level file
      tree.push(file)
    } else {
      // Nested file - create folder structure
      let currentPath = ""
      let currentLevel = tree

      for (let i = 0; i < pathParts.length - 1; i++) {
        currentPath += (i > 0 ? "/" : "") + pathParts[i]

        let folder = folderMap.get(currentPath)
        if (!folder) {
          folder = {
            name: pathParts[i],
            type: "folder",
            children: [],
            path: currentPath,
          }
          folderMap.set(currentPath, folder)
          currentLevel.push(folder)
        }

        currentLevel = folder.children!
      }

      currentLevel.push(file)
    }
  }

  return tree
}
