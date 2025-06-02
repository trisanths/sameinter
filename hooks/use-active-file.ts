"use client"

import { useState, useCallback } from "react"

export interface ActiveFileState {
  path: string | null
  content: string
  language: string
  isDirty: boolean
}

export function useActiveFile() {
  const [activeFile, setActiveFileState] = useState<ActiveFileState>({
    path: null,
    content: "",
    language: "text",
    isDirty: false,
  })

  const setActiveFile = useCallback((path: string | null, content = "", language = "text") => {
    setActiveFileState({
      path,
      content,
      language,
      isDirty: false,
    })
  }, [])

  const updateContent = useCallback((content: string) => {
    setActiveFileState((prev) => ({
      ...prev,
      content,
      isDirty: prev.content !== content,
    }))
  }, [])

  const markClean = useCallback(() => {
    setActiveFileState((prev) => ({
      ...prev,
      isDirty: false,
    }))
  }, [])

  const clearActiveFile = useCallback(() => {
    setActiveFileState({
      path: null,
      content: "",
      language: "text",
      isDirty: false,
    })
  }, [])

  return {
    activeFile,
    setActiveFile,
    updateContent,
    markClean,
    clearActiveFile,
  }
}
