import { type NextRequest, NextResponse } from "next/server";
import { getDatabase, checkDatabaseHealth } from "@/lib/db";
import { messages, conversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { simpleStorage } from "@/lib/simple-storage";

const createMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  toolInvocations: z.array(z.any()).optional(),
  imageUrl: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const conversationId = context.params.id;
    const body = await request.json();
    const { role, content, toolInvocations, imageUrl } =
      createMessageSchema.parse(body);

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    const isDatabaseHealthy = await checkDatabaseHealth();

    if (isDatabaseHealthy) {
      const db = getDatabase();

      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, conversationId));

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      const [message] = await db
        .insert(messages)
        .values({
          conversationId,
          role,
          content,
          toolInvocations: toolInvocations || [],
          imageUrl,
        })
        .returning();

      await db
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, conversationId));

      return NextResponse.json(message);
    } else {
      const message = simpleStorage.createMessage(
        conversationId,
        role,
        content,
        toolInvocations || [],
        imageUrl
      );

      if (!message) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      simpleStorage.save();
      return NextResponse.json(message);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    try {
      const body = await request.json();
      const message = simpleStorage.createMessage(
        context.params.id,
        body.role || "user",
        body.content || "",
        body.toolInvocations || [],
        body.imageUrl
      );

      if (!message) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      simpleStorage.save();
      return NextResponse.json(message);
    } catch (fallbackError) {
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }
  }
}
