-- Add URL column to events table
ALTER TABLE events ADD COLUMN url TEXT;

-- Enable RLS if not already enabled
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for all users" ON events;

-- Create the read access policy
CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT
  USING (true); 