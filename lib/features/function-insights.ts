import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export interface FunctionSignature {
  name: string
  parameters: Parameter[]
  returnType: string
  description: string
  examples?: string[]
}

export interface Parameter {
  name: string
  type: string
  description: string
  optional?: boolean
  defaultValue?: string
}

export class FunctionInsights {
  private static cache = new Map<string, FunctionSignature>()

  static async getFunctionSignature(
    functionName: string,
    code: string,
    language: string,
  ): Promise<FunctionSignature | null> {
    const cacheKey = `${language}:${functionName}:${this.hashCode(code)}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      const prompt = `
Analyze the following ${language} code and provide detailed information about the function "${functionName}":

\`\`\`${language}
${code}
\`\`\`

Provide the function signature and documentation in the following JSON format:
{
  "name": "function_name",
  "parameters": [
    {
      "name": "param_name",
      "type": "param_type",
      "description": "parameter description",
      "optional": false,
      "defaultValue": "default_value_if_any"
    }
  ],
  "returnType": "return_type",
  "description": "detailed function description",
  "examples": ["example usage 1", "example usage 2"]
}

If the function is not found or cannot be analyzed, return null.
`

      const result = await generateText({
        model: openai("gpt-4"),
        prompt,
        maxTokens: 1000,
      })

      const signature = JSON.parse(result.text) as FunctionSignature
      this.cache.set(cacheKey, signature)
      return signature
    } catch (error) {
      console.error("Function analysis error:", error)
      return null
    }
  }

  private static hashCode(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString()
  }

  static clearCache(): void {
    this.cache.clear()
  }
}
