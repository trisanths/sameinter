import { type NextRequest, NextResponse } from "next/server"
import { getDatabase, checkDatabaseHealth } from "@/lib/db"
import { conversations } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { z } from "zod"
import { simpleStorage } from "@/lib/simple-storage"

const createConversationSchema = z.object({
  title: z.string().min(1).max(200),
})

export async function GET() {
  try {
    // Try database first
    const isDatabaseHealthy = await checkDatabaseHealth()

    if (isDatabaseHealthy) {
      const db = getDatabase()
      const allConversations = await db.select().from(conversations).orderBy(desc(conversations.updatedAt)).limit(50)

      console.log("Fetched conversations from database:", allConversations.length)
      return NextResponse.json(allConversations)
    } else {
      // Fallback to simple storage
      console.log("Database not available, using simple storage")
      const allConversations = simpleStorage.getConversations()
      return NextResponse.json(allConversations)
    }
  } catch (error) {
    console.error("Failed to fetch conversations:", error)

    // Fallback to simple storage on any error
    try {
      const allConversations = simpleStorage.getConversations()
      return NextResponse.json(allConversations)
    } catch (fallbackError) {
      console.error("Simple storage also failed:", fallbackError)
      return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title } = createConversationSchema.parse(body)

    // Try database first
    const isDatabaseHealthy = await checkDatabaseHealth()

    if (isDatabaseHealthy) {
      const db = getDatabase()
      const [conversation] = await db.insert(conversations).values({ title }).returning()

      console.log("Created conversation in database:", conversation.id)
      return NextResponse.json(conversation)
    } else {
      // Fallback to simple storage
      console.log("Database not available, using simple storage")
      const conversation = simpleStorage.createConversation(title)
      simpleStorage.save()
      return NextResponse.json(conversation)
    }
  } catch (error) {
    console.error("Failed to create conversation:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data", details: error.errors }, { status: 400 })
    }

    // Try simple storage as fallback
    try {
      const body = await request.json()
      const conversation = simpleStorage.createConversation(body.title || "New Conversation")
      simpleStorage.save()
      return NextResponse.json(conversation)
    } catch (fallbackError) {
      console.error("Simple storage also failed:", fallbackError)
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }
  }
}
