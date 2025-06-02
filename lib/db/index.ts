import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "@/lib/config";

let db: ReturnType<typeof drizzle> | null = null;
let client: ReturnType<typeof postgres> | null = null;

export function getDatabase() {
  if (!db && config.database.url) {
    if (!client) {
      client = postgres(config.database.url, {
        max: 10, // Maximum number of connections
        idle_timeout: 20, // Idle connection timeout in seconds
        connect_timeout: 10, // Connection timeout in seconds
      });
    }
    db = drizzle(client);
  }

  if (!db) {
    throw new Error("Database not configured");
  }

  return db;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!config.database.url) {
      return false;
    }

    const database = getDatabase();
    await database.execute("SELECT 1");
    return true;
  } catch (error) {
    return false;
  }
}

// Cleanup function to close the database connection
export async function cleanup() {
  if (client) {
    await client.end();
    client = null;
    db = null;
  }
}
