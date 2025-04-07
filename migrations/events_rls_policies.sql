-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy for reading events (everyone can read)
CREATE POLICY "Enable read access for all users" ON events
  FOR SELECT
  USING (true);

-- Policy for creating events (authenticated users only)
CREATE POLICY "Enable insert access for authenticated users" ON events
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy for updating events (only creator can update)
CREATE POLICY "Enable update access for event creator" ON events
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy for deleting events (only creator can delete)
CREATE POLICY "Enable delete access for event creator" ON events
  FOR DELETE
  USING (auth.uid() = created_by); 