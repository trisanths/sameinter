import { z } from "zod"

const ExecutionResultSchema = z.object({
  output: z.string(),
  error: z.string().optional(),
  executionTime: z.number(),
  success: z.boolean(),
})

export type ExecutionResult = z.infer<typeof ExecutionResultSchema>

export class CodeExecutor {
  private static instance: CodeExecutor
  private pythonWorker: Worker | null = null

  static getInstance(): CodeExecutor {
    if (!CodeExecutor.instance) {
      CodeExecutor.instance = new CodeExecutor()
    }
    return CodeExecutor.instance
  }

  async executePython(code: string): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      console.log("CodeExecutor: Executing Python code:", code.substring(0, 100) + "...")

      // Sanitize Python code
      const sanitizedCode = this.sanitizePythonCode(code)

      // Use PyScript for Python execution in browser
      if (typeof window !== "undefined") {
        const result = await this.executePythonInBrowser(sanitizedCode)
        console.log("CodeExecutor: Python execution result:", result)
        return {
          output: result.output,
          error: result.error,
          executionTime: Date.now() - startTime,
          success: !result.error,
        }
      }

      // Fallback for server-side (mock execution)
      return {
        output: "Python execution not available on server",
        error: undefined,
        executionTime: Date.now() - startTime,
        success: false,
      }
    } catch (error: any) {
      console.error("CodeExecutor: Python execution error:", error)
      return {
        output: "",
        error: error.message,
        executionTime: Date.now() - startTime,
        success: false,
      }
    }
  }

  private sanitizePythonCode(code: string): string {
    // Remove potentially dangerous imports and operations
    const dangerousPatterns = [
      /import\s+os/gi,
      /import\s+subprocess/gi,
      /from\s+os\s+import/gi,
      /from\s+subprocess\s+import/gi,
      /exec\s*\(/gi,
      /eval\s*\(/gi,
      /__import__\s*\(/gi,
      /open\s*\(/gi,
      /file\s*\(/gi,
    ]

    let sanitized = code
    dangerousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "# Blocked dangerous operation")
    })

    return sanitized
  }

  private async executePythonInBrowser(code: string): Promise<{ output: string; error?: string }> {
    try {
      console.log("CodeExecutor: Executing Python in browser with PyScript")

      // Load Pyodide if not already loaded (fallback to Pyodide for better reliability)
      if (!(window as any).pyodide) {
        console.log("CodeExecutor: Loading Pyodide...")
        const pyodideScript = document.createElement("script")
        pyodideScript.src = "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js"
        document.head.appendChild(pyodideScript)

        await new Promise((resolve, reject) => {
          pyodideScript.onload = resolve
          pyodideScript.onerror = reject
        })

        console.log("CodeExecutor: Initializing Pyodide...")
        ;(window as any).pyodide = await (window as any).loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
        })
        console.log("CodeExecutor: Pyodide initialized successfully")
      }

      const pyodide = (window as any).pyodide

      // Capture stdout
      pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
`)

      console.log("CodeExecutor: Running Python code...")
      // Execute the code
      pyodide.runPython(code)

      // Get output
      const stdout = pyodide.runPython("sys.stdout.getvalue()")
      const stderr = pyodide.runPython("sys.stderr.getvalue()")

      console.log("CodeExecutor: Python stdout:", stdout)
      console.log("CodeExecutor: Python stderr:", stderr)

      return {
        output: stdout || "",
        error: stderr || undefined,
      }
    } catch (error: any) {
      console.error("CodeExecutor: Python execution error:", error)
      return {
        output: "",
        error: error.message,
      }
    }
  }

  executeHTML(code: string): { preview: string; error?: string } {
    try {
      const preview = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
          </style>
        </head>
        <body>
          ${code}
        </body>
        </html>
      `
      return { preview }
    } catch (error) {
      return { preview: "", error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  executeCSS(code: string, html?: string): { preview: string; error?: string } {
    try {
      const htmlContent = html || "<div>CSS Preview</div>"
      const preview = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui, sans-serif; }
            ${code}
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `
      return { preview }
    } catch (error) {
      return { preview: "", error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  private sanitizeHTML(html: string): string {
    // Remove potentially dangerous elements and attributes
    const dangerousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
      /<object[^>]*>[\s\S]*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<form[^>]*>[\s\S]*?<\/form>/gi,
      /on\w+\s*=/gi, // Remove event handlers
      /javascript:/gi,
    ]

    let sanitized = html
    dangerousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "")
    })

    return sanitized
  }

  private sanitizeCSS(css: string): string {
    // Remove potentially dangerous CSS
    const dangerousPatterns = [/@import\s+url\(/gi, /expression\s*\(/gi, /javascript:/gi, /vbscript:/gi, /data:/gi]

    let sanitized = css
    dangerousPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "/* blocked */")
    })

    return sanitized
  }
}

// Export the executeCode function with correct parameter order
export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
  console.log("executeCode called with language:", language, "code length:", code.length)

  const executor = CodeExecutor.getInstance()

  switch (language.toLowerCase()) {
    case "python":
    case "py":
      console.log("executeCode: Executing Python code")
      return await executor.executePython(code)
    default:
      console.error("executeCode: Unsupported language:", language)
      return {
        output: `Language ${language} not supported`,
        error: `Unsupported language: ${language}`,
        executionTime: 0,
        success: false,
      }
  }
}
