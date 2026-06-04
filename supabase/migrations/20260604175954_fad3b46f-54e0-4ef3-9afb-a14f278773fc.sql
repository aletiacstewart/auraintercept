ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Deny all realtime broadcast access" ON realtime.messages;
CREATE POLICY "Deny all realtime broadcast access"
ON realtime.messages
AS RESTRICTIVE
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);