-- Add AI agent voice greeting to companies table
ALTER TABLE public.companies 
ADD COLUMN ai_voice_greeting TEXT DEFAULT 'Hello! Thank you for calling. How can I assist you today?';

-- Add AI agent system prompt for customization
ALTER TABLE public.companies 
ADD COLUMN ai_agent_prompt TEXT DEFAULT 'You are a helpful AI assistant for this business. Help callers with scheduling appointments, answering questions about services, and providing information about business hours.';