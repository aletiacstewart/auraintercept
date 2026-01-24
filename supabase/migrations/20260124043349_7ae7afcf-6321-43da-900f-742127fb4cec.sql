-- Add decision transparency columns to ai_agent_events table
ALTER TABLE ai_agent_events 
ADD COLUMN IF NOT EXISTS decision_mode text DEFAULT 'auto',
ADD COLUMN IF NOT EXISTS confidence_score numeric(3,2),
ADD COLUMN IF NOT EXISTS requires_human_review boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS override_reason text,
ADD COLUMN IF NOT EXISTS action_description text;

-- Add constraint for decision_mode values
ALTER TABLE ai_agent_events 
ADD CONSTRAINT check_decision_mode CHECK (decision_mode IN ('auto', 'review', 'escalate'));

-- Add constraint for confidence_score range
ALTER TABLE ai_agent_events 
ADD CONSTRAINT check_confidence_score CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

-- Create index for quick lookup of items needing review
CREATE INDEX IF NOT EXISTS idx_ai_agent_events_needs_review 
ON ai_agent_events (company_id, requires_human_review, created_at DESC) 
WHERE requires_human_review = true;

-- Create index for decision mode filtering
CREATE INDEX IF NOT EXISTS idx_ai_agent_events_decision_mode 
ON ai_agent_events (company_id, decision_mode, created_at DESC);