import { z } from "zod"

const CodeBlockSchema = z.object({
  language: z.string(),
  content: z.string(),
  filename: z.string().optional(),
})

export interface ParsedCodeBlock {
  language: string
  content: string
  filename: string
}

export function parseCodeBlocksFromMessage(content: string): ParsedCodeBlock[] {
  const codeBlocks: ParsedCodeBlock[] = []

  // Enhanced regex to capture code blocks with better language detection
  const codeBlockRegex = /```(\w+)?\s*(?:file[=:]?"?([^"\n]+)"?)?\s*\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, language = "text", filename, code] = match

    if (code.trim()) {
      // Generate filename if not provided
      let finalFilename = filename
      if (!finalFilename) {
        finalFilename = generateFilename(code, language)
      }

      codeBlocks.push({
        language: normalizeLanguage(language),
        content: code.trim(),
        filename: finalFilename,
      })
    }
  }

  return codeBlocks
}

function generateFilename(code: string, language: string): string {
  // Try to extract component/function name from code
  const componentMatch = code.match(/(?:export\s+default\s+)?(?:function\s+|const\s+|class\s+)(\w+)/i)
  const baseName = componentMatch?.[1] || "Component"

  // Map language to extension
  const extensionMap: Record<string, string> = {
    typescript: ".ts",
    tsx: ".tsx",
    jsx: ".jsx",
    javascript: ".js",
    python: ".py",
    html: ".html",
    css: ".css",
    json: ".json",
  }

  const extension = extensionMap[language] || ".txt"
  return `${baseName}${extension}`
}

function normalizeLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    ts: "typescript",
    js: "javascript",
    py: "python",
    htm: "html",
  }

  return languageMap[language.toLowerCase()] || language.toLowerCase()
}

export function detectProjectType(codeBlocks: ParsedCodeBlock[]): "react" | "python" | "web" | "mixed" | null {
  if (codeBlocks.length === 0) return null

  const languages = codeBlocks.map((block) => block.language)
  const hasReact = languages.some((lang) => ["tsx", "jsx", "typescript", "javascript"].includes(lang))
  const hasPython = languages.includes("python")
  const hasWeb = languages.some((lang) => ["html", "css"].includes(lang))

  if (hasReact && hasPython) return "mixed"
  if (hasReact) return "react"
  if (hasPython) return "python"
  if (hasWeb) return "web"

  return null
}

export function shouldAutoOpenCanvas(codeBlocks: ParsedCodeBlock[]): boolean {
  // Auto-open canvas if we have multiple files or a complete project
  if (codeBlocks.length >= 2) return true

  // Auto-open for single files that look like complete components
  if (codeBlocks.length === 1) {
    const block = codeBlocks[0]
    const hasImports = block.content.includes("import")
    const hasExports = block.content.includes("export")
    const isComponent = /(?:function\s+\w+|const\s+\w+\s*=.*=>|class\s+\w+)/.test(block.content)

    return hasImports || hasExports || isComponent
  }

  return false
}

export function createFileSystemFromCodeBlocks(
  codeBlocks: ParsedCodeBlock[],
): Record<string, { content: string; language: string }> {
  const fileSystem: Record<string, { content: string; language: string }> = {}

  codeBlocks.forEach((block) => {
    fileSystem[block.filename] = {
      content: block.content,
      language: block.language,
    }
  })

  return fileSystem
}
