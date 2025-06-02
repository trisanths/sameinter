ALTER TABLE conversations
ADD COLUMN initial_prompt TEXT,
ADD COLUMN canvas_state JSONB;
