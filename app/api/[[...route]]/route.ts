import { Hono } from "hono"
import { handle } from "hono/vercel"
import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { tools } from "@/lib/tools"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import { config, validateConfig, isDatabaseConfigured, isAIConfigured, securityHeaders } from "@/lib/config"

const app = new Hono().basePath("/api")

app.use("*", async (c, next) => {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    c.header(key, value)
  })

  c.header("Access-Control-Allow-Origin", config.app.url)
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization")

  if (c.req.method === "OPTIONS") {
    return c.text("", 204)
  }

  await next()
})

const CreateConversationSchema = z.object({
  title: z.string().min(1).max(200),
  initialPrompt: z.string().optional(),
  canvasState: z.any().optional(),
})

const UpdateConversationSchema = z.object({
  canvasState: z.any().optional(),
})

const ChatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  conversationId: z.string().uuid().optional(),
})

const inMemoryConversations: any[] = []
const inMemoryMessages: any[] = []

try {
  validateConfig()
} catch (error) {
  process.exit(1)
}

async function checkDatabase() {
  try {
    if (!isDatabaseConfigured()) {
      return false
    }

    const { getDatabase } = await import("@/lib/db")
    const { conversations } = await import("@/lib/db/schema")

    const db = getDatabase()
    await db.select().from(conversations).limit(1)
    return true
  } catch (error) {
    return false
  }
}

app.get("/conversations", async (c) => {
  try {
    const hasDb = await checkDatabase()

    if (hasDb) {
      const { getDatabase } = await import("@/lib/db")
      const { conversations } = await import("@/lib/db/schema")
      const { desc } = await import("drizzle-orm")

      const db = getDatabase()
      const allConversations = await db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(100)

      return c.json(allConversations)
    } else {
      return c.json(
        inMemoryConversations
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 100),
      )
    }
  } catch (error) {
    return c.json({ error: "Failed to fetch conversations" }, 500)
  }
})

app.get("/conversations/:id", async (c) => {
  try {
    const conversationId = c.req.param("id")

    if (!z.string().uuid().safeParse(conversationId).success) {
      return c.json({ error: "Invalid conversation ID" }, 400)
    }

    const hasDb = await checkDatabase()

    if (hasDb) {
      const { getDatabase } = await import("@/lib/db")
      const { conversations, messages } = await import("@/lib/db/schema")
      const { eq, asc } = await import("drizzle-orm")

      const db = getDatabase()
      const conversation = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1)

      if (!conversation.length) {
        return c.json({ error: "Conversation not found" }, 404)
      }

      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt))
        .limit(1000)

      return c.json({
        conversation: conversation[0],
        messages: conversationMessages,
      })
    } else {
      const conversation = inMemoryConversations.find((c) => c.id === conversationId)
      if (!conversation) {
        return c.json({ error: "Conversation not found" }, 404)
      }

      const conversationMessages = inMemoryMessages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .slice(0, 1000)

      return c.json({
        conversation,
        messages: conversationMessages,
      })
    }
  } catch (error) {
    return c.json({ error: "Failed to fetch conversation" }, 500)
  }
})

app.delete("/conversations/:id", async (c) => {
  try {
    const conversationId = c.req.param("id")

    if (!z.string().uuid().safeParse(conversationId).success) {
      return c.json({ error: "Invalid conversation ID" }, 400)
    }

    const hasDb = await checkDatabase()

    if (hasDb) {
      const { getDatabase } = await import("@/lib/db")
      const { conversations } = await import("@/lib/db/schema")
      const { eq } = await import("drizzle-orm")

      const db = getDatabase()
      await db.delete(conversations).where(eq(conversations.id, conversationId))
      return c.json({ success: true })
    } else {
      const index = inMemoryConversations.findIndex((c) => c.id === conversationId)
      if (index !== -1) {
        inMemoryConversations.splice(index, 1)
        for (let i = inMemoryMessages.length - 1; i >= 0; i--) {
          if (inMemoryMessages[i].conversationId === conversationId) {
            inMemoryMessages.splice(i, 1)
          }
        }
      }
      return c.json({ success: true })
    }
  } catch (error) {
    return c.json({ error: "Failed to delete conversation" }, 500)
  }
})

app.post("/conversations", async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = CreateConversationSchema.parse(body)

    const hasDb = await checkDatabase()

    if (hasDb) {
      const { getDatabase } = await import("@/lib/db")
      const { conversations } = await import("@/lib/db/schema")

      const db = getDatabase()
      const newConversation = await db
        .insert(conversations)
        .values({
          title: validatedData.title,
          initialPrompt: validatedData.initialPrompt,
          canvasState: validatedData.canvasState,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      return c.json(newConversation[0])
    } else {
      const newConversation = {
        id: uuidv4(),
        title: validatedData.title,
        initialPrompt: validatedData.initialPrompt,
        canvasState: validatedData.canvasState,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      inMemoryConversations.push(newConversation)
      return c.json(newConversation)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400)
    }
    return c.json({ error: "Failed to create conversation" }, 500)
  }
})

app.put("/conversations/:id", async (c) => {
  try {
    const conversationId = c.req.param("id")

    if (!z.string().uuid().safeParse(conversationId).success) {
      return c.json({ error: "Invalid conversation ID" }, 400)
    }

    const body = await c.req.json()
    const validatedData = UpdateConversationSchema.parse(body)

    const hasDb = await checkDatabase()

    if (hasDb) {
      const { getDatabase } = await import("@/lib/db")
      const { conversations } = await import("@/lib/db/schema")
      const { eq } = await import("drizzle-orm")

      const db = getDatabase()
      await db
        .update(conversations)
        .set({
          canvasState: validatedData.canvasState,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversationId))

      return c.json({ success: true })
    } else {
      const conversation = inMemoryConversations.find((c) => c.id === conversationId)
      if (conversation) {
        conversation.canvasState = validatedData.canvasState
        conversation.updatedAt = new Date().toISOString()
      }
      return c.json({ success: true })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400)
    }
    return c.json({ error: "Failed to update conversation" }, 500)
  }
})

app.post("/agent", async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = ChatMessageSchema.parse(body)

    if (!isAIConfigured()) {
      return c.json({ error: "AI service not configured" }, 500)
    }

    const { messages: chatMessages, conversationId } = validatedData
    const lastMessage = chatMessages[chatMessages.length - 1]

    if (conversationId && lastMessage?.role === "user") {
      try {
        const hasDb = await checkDatabase()
        const messageId = uuidv4()

        if (hasDb) {
          const { getDatabase } = await import("@/lib/db")
          const { messages } = await import("@/lib/db/schema")

          const db = getDatabase()
          await db.insert(messages).values({
            id: messageId,
            conversationId,
            role: "user",
            content: lastMessage.content,
            createdAt: new Date(),
          })
        } else {
          const newMessage = {
            id: messageId,
            conversationId,
            role: "user",
            content: lastMessage.content,
            createdAt: new Date().toISOString(),
          }
          inMemoryMessages.push(newMessage)
        }
      } catch (dbError) {
        console.error("Failed to save user message:", dbError)
      }
    }

    const result = streamText({
      model: openai(config.ai.model),
      messages: chatMessages,
      tools,
      temperature: config.ai.temperature,
      maxSteps: config.ai.maxSteps,
      experimental_streamingToolCalls: true,
      system: `You are an AI assistant that helps users create React components and Next.js applications.

IMPORTANT GUIDELINES:
- Only use tools when explicitly requested to create code
- For questions or explanations, respond without using tools
- Always validate and sanitize any code before generation
- Follow React and Next.js best practices
- Ensure all generated code is secure and production-ready`,

      onFinish: async (result) => {
        if (conversationId && result.text) {
          try {
            const hasDb = await checkDatabase()
            const messageId = uuidv4()

            if (hasDb) {
              const { getDatabase } = await import("@/lib/db")
              const { messages, conversations } = await import("@/lib/db/schema")
              const { eq } = await import("drizzle-orm")

              const db = getDatabase()
              await db.insert(messages).values({
                id: messageId,
                conversationId,
                role: "assistant",
                content: result.text,
                metadata: result.toolCalls ? { toolCalls: result.toolCalls } : null,
                createdAt: new Date(),
              })

              await db.update(conversations).set({ updatedAt: new Date() }).where(eq(conversations.id, conversationId))
            } else {
              const newMessage = {
                id: messageId,
                conversationId,
                role: "assistant",
                content: result.text,
                metadata: result.toolCalls ? { toolCalls: result.toolCalls } : null,
                createdAt: new Date().toISOString(),
              }
              inMemoryMessages.push(newMessage)

              const conversation = inMemoryConversations.find((c) => c.id === conversationId)
              if (conversation) {
                conversation.updatedAt = new Date().toISOString()
              }
            }
          } catch (dbError) {
            console.error("Failed to save assistant response:", dbError)
          }
        }
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid request data", details: error.errors }, 400)
    }
    return c.json({ error: "Failed to process request" }, 500)
  }
})

app.get("/health", async (c) => {
  try {
    const hasDb = await checkDatabase()
    const hasOpenAI = isAIConfigured()

    return c.json({
      status: "ok",
      database: hasDb ? "connected" : "using in-memory storage",
      ai: hasOpenAI ? "configured" : "missing",
      environment: config.app.nodeEnv,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return c.json(
      {
        status: "error",
        database: "error",
        ai: isAIConfigured() ? "configured" : "missing",
        error: "Health check failed",
        timestamp: new Date().toISOString(),
      },
      500,
    )
  }
})

export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const DELETE = handle(app)
