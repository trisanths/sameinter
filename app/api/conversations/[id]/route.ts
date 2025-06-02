import { type NextRequest, NextResponse } from "next/server";
import { getDatabase, checkDatabaseHealth } from "@/lib/db";
import { conversations, messages } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { simpleStorage } from "@/lib/simple-storage";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const conversationId = context.params.id;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Try database first
    const isDatabaseHealthy = await checkDatabaseHealth();

    if (isDatabaseHealthy) {
      const db = getDatabase();

      // Get conversation
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

      // Get messages
      const conversationMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(messages.createdAt);

      console.log(
        "Fetched conversation from database:",
        conversationId,
        "with",
        conversationMessages.length,
        "messages"
      );

      return NextResponse.json({
        ...conversation,
        messages: conversationMessages,
      });
    } else {
      // Fallback to simple storage
      console.log("Database not available, using simple storage");
      const conversation = simpleStorage.getConversation(conversationId);

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(conversation);
    }
  } catch (error) {
    console.error("Failed to fetch conversation:", error);

    // Try simple storage as fallback
    try {
      const conversation = simpleStorage.getConversation(context.params.id);
      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(conversation);
    } catch (fallbackError) {
      console.error("Simple storage also failed:", fallbackError);
      return NextResponse.json(
        { error: "Failed to fetch conversation" },
        { status: 500 }
      );
    }
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const conversationId = context.params.id;

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      );
    }

    // Try database first
    const isDatabaseHealthy = await checkDatabaseHealth();

    if (isDatabaseHealthy) {
      const db = getDatabase();

      // Delete conversation (messages will be deleted via cascade)
      const [deletedConversation] = await db
        .delete(conversations)
        .where(eq(conversations.id, conversationId))
        .returning();

      if (!deletedConversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      console.log("Deleted conversation from database:", conversationId);
      return NextResponse.json({ success: true });
    } else {
      // Fallback to simple storage
      console.log("Database not available, using simple storage");
      const success = simpleStorage.deleteConversation(conversationId);

      if (!success) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      simpleStorage.save();
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error("Failed to delete conversation:", error);

    // Try simple storage as fallback
    try {
      const success = simpleStorage.deleteConversation(context.params.id);
      if (!success) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
      simpleStorage.save();
      return NextResponse.json({ success: true });
    } catch (fallbackError) {
      console.error("Simple storage also failed:", fallbackError);
      return NextResponse.json(
        { error: "Failed to delete conversation" },
        { status: 500 }
      );
    }
  }
}
