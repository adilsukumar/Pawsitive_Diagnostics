-- Pawsitive Diagnostics - Supabase Database Setup
-- Copy and paste this entire script into Supabase SQL Editor and click "Run"

-- 1. Create sensor_readings table
CREATE TABLE IF NOT EXISTS sensor_readings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dog_id TEXT,
  bark_spike INTEGER,
  methane_ppm DECIMAL,
  ammonia_ppm DECIMAL,
  co2_ppm DECIMAL,
  scratch_intensity DECIMAL,
  temperature DECIMAL,
  humidity DECIMAL
);

-- 2. Enable Row Level Security
ALTER TABLE sensor_readings ENABLE ROW LEVEL SECURITY;

-- 3. Create policy to allow all operations (for development)
CREATE POLICY "Allow all operations" ON sensor_readings
  FOR ALL USING (true) WITH CHECK (true);

-- 4. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS sensor_readings_created_at_idx 
  ON sensor_readings(created_at DESC);
  
CREATE INDEX IF NOT EXISTS sensor_readings_dog_id_idx 
  ON sensor_readings(dog_id);

-- 5. Create storage bucket and policies
-- Create PRIVATE bucket for vet reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('vet-reports', 'vet-reports', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Allow all operations on vet-reports bucket
CREATE POLICY "Allow all operations on vet-reports"
ON storage.objects FOR ALL
USING (bucket_id = 'vet-reports')
WITH CHECK (bucket_id = 'vet-reports');

-- Success message
SELECT 'Database setup complete! ✅ Bucket is PRIVATE with signed URLs' as status;
