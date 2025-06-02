import { tool } from "ai"
import { z } from "zod"

export const tools = {
  createReactComponent: tool({
    description: "Create a React component with TypeScript",
    parameters: z.object({
      componentName: z.string().describe("Name of the React component"),
      componentCode: z.string().describe("Complete React component code"),
      fileName: z.string().optional().describe("File name for the component"),
      description: z.string().optional().describe("Description of what the component does"),
    }),
    execute: async ({ componentName, componentCode, fileName, description }) => {
      return {
        success: true,
        componentName,
        componentCode,
        fileName: fileName || `${componentName}.tsx`,
        description,
      }
    },
  }),

  createNextJSProject: tool({
    description: "Create a complete Next.js project with multiple files",
    parameters: z.object({
      projectName: z.string().describe("Name of the Next.js project"),
      mainPageCode: z.string().describe("Code for the main page component"),
      additionalFiles: z
        .record(
          z.object({
            content: z.string(),
            language: z.string(),
          }),
        )
        .optional()
        .describe("Additional files for the project"),
      description: z.string().optional().describe("Description of the project"),
    }),
    execute: async ({ projectName, mainPageCode, additionalFiles, description }) => {
      return {
        success: true,
        projectName,
        mainPageCode,
        additionalFiles: additionalFiles || {},
        description,
      }
    },
  }),

  analyzeCode: tool({
    description: "Analyze code for potential issues, improvements, or explanations",
    parameters: z.object({
      code: z.string().describe("Code to analyze"),
      language: z.string().describe("Programming language of the code"),
      analysisType: z.enum(["bugs", "performance", "security", "style", "explanation"]).describe("Type of analysis"),
    }),
    execute: async ({ code, language, analysisType }) => {
      return {
        success: true,
        analysis: `Analysis of ${language} code for ${analysisType}`,
        suggestions: [],
        code,
      }
    },
  }),
}
