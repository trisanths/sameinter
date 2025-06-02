import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/db"
import { conversations } from "@/lib/db/schema"
import { count } from "drizzle-orm"

export async function GET() {
  try {
    // Add security headers
    const headers = new Headers()
    headers.set("X-Content-Type-Options", "nosniff")
    headers.set("X-Frame-Options", "DENY")
    headers.set("Cache-Control", "no-cache")

    // Basic health check
    const healthData = {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    }

    try {
      // Test database connection
      const db = getDatabase()
      const result = await db.select({ count: count() }).from(conversations)

      return NextResponse.json(
        {
          ...healthData,
          database: "connected",
          conversationCount: result[0]?.count || 0,
        },
        { headers },
      )
    } catch (dbError) {
      console.error("Database health check error:", dbError)

      // Check if it's a table not found error
      if (dbError instanceof Error && dbError.message.includes("does not exist")) {
        return NextResponse.json(
          {
            ...healthData,
            database: "tables_missing",
            status: "degraded",
            message: "Database tables need to be created",
          },
          { status: 503, headers },
        )
      }

      return NextResponse.json(
        {
          ...healthData,
          database: "error",
          status: "degraded",
          error: "Database connection failed",
        },
        { status: 503, headers },
      )
    }
  } catch (error) {
    console.error("Health check error:", error)
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 500 },
    )
  }
}
