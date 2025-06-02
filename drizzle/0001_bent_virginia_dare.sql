ALTER TABLE "messages" ADD COLUMN "tool_invocations" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "image_url" text;