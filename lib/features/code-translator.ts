import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface TranslationRequest {
  code: string
  fromLanguage: string
  toLanguage: string
  preserveComments?: boolean
}

export interface TranslationResult {
  translatedCode: string
  explanation?: string
  warnings?: string[]
}

export class CodeTranslator {
  private static supportedLanguages = [
    "javascript",
    "typescript",
    "python",
    "java",
    "csharp",
    "cpp",
    "rust",
    "go",
    "php",
    "ruby",
    "swift",
    "kotlin",
    "dart",
    "scala",
    "r",
  ]

  static getSupportedLanguages(): string[] {
    return [...this.supportedLanguages]
  }

  static async translateCode(request: TranslationRequest): Promise<TranslationResult> {
    try {
      const { code, fromLanguage, toLanguage, preserveComments = true } = request

      if (
        !this.supportedLanguages.includes(fromLanguage.toLowerCase()) ||
        !this.supportedLanguages.includes(toLanguage.toLowerCase())
      ) {
        throw new Error(`Unsupported language combination: ${fromLanguage} to ${toLanguage}`)
      }

      const prompt = `
Translate the following ${fromLanguage} code to ${toLanguage}:

\`\`\`${fromLanguage}
${code}
\`\`\`

Requirements:
- Maintain the same functionality and logic
- Follow ${toLanguage} best practices and conventions
- ${preserveComments ? "Preserve comments and translate them if needed" : "Remove comments"}
- Ensure the translated code is syntactically correct
- If there are language-specific concepts that don't translate directly, provide equivalent implementations

Provide the translation in the following format:
TRANSLATED_CODE:
\`\`\`${toLanguage}
[translated code here]
\`\`\`

EXPLANATION:
[Brief explanation of any significant changes or considerations]

WARNINGS:
[Any potential issues or limitations in the translation]
`

      const result = await generateText({
        model: openai("gpt-4"),
        prompt,
        maxTokens: 2000,
      })

      return this.parseTranslationResult(result.text)
    } catch (error) {
      console.error("Code translation error:", error)
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private static parseTranslationResult(response: string): TranslationResult {
    const codeMatch = response.match(/TRANSLATED_CODE:\s*```[\w]*\n([\s\S]*?)\n```/)
    const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]*?)(?=WARNINGS:|$)/)
    const warningsMatch = response.match(/WARNINGS:\s*([\s\S]*)$/)

    const translatedCode = codeMatch?.[1]?.trim() || response.trim()
    const explanation = explanationMatch?.[1]?.trim()
    const warnings =
      warningsMatch?.[1]
        ?.trim()
        .split("\n")
        .filter((w) => w.trim()) || []

    return {
      translatedCode,
      explanation,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }
}
