import { z } from "zod";

// Environment variable validation schemas
const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().optional(),
  POSTGRES_HOST: z.string().optional(),
  POSTGRES_PORT: z
    .string()
    .transform((val) => (val ? Number(val) : undefined))
    .pipe(z.number().int().min(1).max(65535).optional())
    .optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
  POSTGRES_DATABASE: z.string().optional(),
});

const AIConfigSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OpenAI API key is required"),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  OPENAI_TEMPERATURE: z
    .string()
    .transform((val) => (val ? Number(val) : 0.3))
    .pipe(z.number().min(0).max(2))
    .optional(),
  OPENAI_MAX_STEPS: z
    .string()
    .transform((val) => (val ? Number(val) : 5))
    .pipe(z.number().int().min(1).max(10))
    .optional(),
});

const AppConfigSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform((val) => (val ? Number(val) : 3000))
    .pipe(z.number().int().min(1).max(65535))
    .optional(),
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
});

// Combined configuration schema
const ConfigSchema =
  DatabaseConfigSchema.merge(AIConfigSchema).merge(AppConfigSchema);

// Parse and validate environment variables with better error handling
function parseConfig() {
  try {
    return ConfigSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter(
          (err) => err.code === "invalid_type" && err.received === "undefined"
        )
        .map((err) => err.path.join("."));

      if (missingVars.includes("OPENAI_API_KEY")) {
        console.error("OPENAI_API_KEY is required but not provided");
      }

      // Return default config for non-critical errors
      return {
        NODE_ENV: process.env.NODE_ENV || "development",
        PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
        NEXT_PUBLIC_APP_URL:
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
        OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o",
        OPENAI_TEMPERATURE: process.env.OPENAI_TEMPERATURE
          ? Number(process.env.OPENAI_TEMPERATURE)
          : 0.3,
        OPENAI_MAX_STEPS: process.env.OPENAI_MAX_STEPS
          ? Number(process.env.OPENAI_MAX_STEPS)
          : 5,
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_HOST: process.env.POSTGRES_HOST,
        POSTGRES_PORT: process.env.POSTGRES_PORT
          ? Number(process.env.POSTGRES_PORT)
          : undefined,
        POSTGRES_USER: process.env.POSTGRES_USER,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE,
      };
    }
    throw error;
  }
}

// Export validated configuration
const parsedConfig = parseConfig();

export const config = {
  app: {
    name: "DevChat",
    url: parsedConfig.NEXT_PUBLIC_APP_URL,
    nodeEnv: parsedConfig.NODE_ENV,
  },
  ai: {
    model: parsedConfig.OPENAI_MODEL,
    temperature: parsedConfig.OPENAI_TEMPERATURE,
    maxSteps: parsedConfig.OPENAI_MAX_STEPS,
  },
  database: {
    url: parsedConfig.DATABASE_URL,
  },
};

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export const rateLimits = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.app.nodeEnv === "production" ? 100 : 1000, // requests per window
  message: "Too many requests from this IP, please try again later.",
};

export function validateConfig() {
  const required = ["OPENAI_API_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

export function isDatabaseConfigured(): boolean {
  return !!config.database.url;
}

export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Helper to get database connection string with fallbacks
 * @returns The database connection URL
 */
export function getDatabaseUrl(): string {
  if (config.database.url) {
    return config.database.url;
  }

  if (
    process.env.POSTGRES_HOST &&
    process.env.POSTGRES_USER &&
    process.env.POSTGRES_PASSWORD &&
    process.env.POSTGRES_DATABASE
  ) {
    return `postgresql://${process.env.POSTGRES_USER}:${
      process.env.POSTGRES_PASSWORD
    }@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT || 5432}/${
      process.env.POSTGRES_DATABASE
    }`;
  }

  return "";
}
