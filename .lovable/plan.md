

## Fix: Add LLM Prompt Extraction Text for Each Tool Parameter

### Problem
When creating client tools in the ElevenLabs dashboard, selecting "LLM Prompt" as the parameter type reveals a required text field: *"This field will be passed to the LLM and should describe in detail how to extract the data from the transcript."* The current setup guide does not provide this text, leaving users stuck.

### Solution
Update the `getToolConfigs` data and the parameter rendering to include a dedicated `llmPrompt` field for each parameter. This text will be shown as a copyable field in the guide, telling users exactly what to paste into the ElevenLabs LLM Prompt box.

### Changes

**File: `src/components/integrations/ElevenLabsSetupGuide.tsx`**

1. Add `llmPrompt` property to the `ToolConfig` type's `bodyParams`
2. Add specific LLM prompt extraction instructions for each parameter:

   **get_services:**
   - `service_type`: "Extract the type of service the customer is asking about. If they haven't mentioned a specific service yet, leave this empty."

   **check_availability:**
   - `preferred_date`: "Extract the date the customer wants to book. Convert natural language like 'tomorrow', 'next Monday', 'this Friday' into YYYY-MM-DD format. If the customer says 'tomorrow' and today is 2026-02-11, return '2026-02-12'."
   - `service_type`: "Extract the service type the customer wants to check availability for from the conversation context."

   **create_appointment:**
   - `customer_name`: "Extract the customer's full name from the conversation. Listen for when they state their name after being asked."
   - `customer_phone`: "Extract the customer's phone number from the conversation. It may be spoken digit by digit or as a full number."
   - `customer_email`: "Extract the customer's email address if they provided one during the conversation."
   - `service_type`: "Extract which service the customer selected for their appointment from the conversation."
   - `datetime`: "Combine the confirmed date and time slot into ISO format (YYYY-MM-DDTHH:MM:SS). Use the date from check_availability and the specific time the customer chose."
   - `duration_minutes`: "Extract the appointment duration in minutes if discussed. Default to 60 if not mentioned."
   - `notes`: "Extract any additional notes, special requests, or details the customer mentioned about their service needs."

3. Update the parameter card UI to show this LLM prompt text as a copyable field (similar to the "Value" field styling but in purple) instead of just the generic note.
