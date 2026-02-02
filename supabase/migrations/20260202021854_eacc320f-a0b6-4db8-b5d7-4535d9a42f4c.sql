-- Add console feature visibility toggles to smart_websites table
ALTER TABLE smart_websites
ADD COLUMN IF NOT EXISTS show_console_appointments BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_console_quotes BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_console_tracking BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_console_billing BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_console_emergency BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_console_feedback BOOLEAN DEFAULT true;