ALTER TABLE messages
ADD COLUMN tool_invocations JSONB DEFAULT '[]',
ADD COLUMN image_url TEXT; 