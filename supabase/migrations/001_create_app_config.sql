-- Create app_config table to store application configuration
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_config_key ON app_config(key);

-- Enable Row Level Security
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated users to read app_config"
  ON app_config
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to manage app_config"
  ON app_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow anonymous access for reading (for login page)
CREATE POLICY "Allow anonymous users to read app_config"
  ON app_config
  FOR SELECT
  TO anon
  USING (true);

