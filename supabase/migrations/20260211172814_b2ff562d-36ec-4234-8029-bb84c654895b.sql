
-- Create a public storage bucket for vet report PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('vet-reports', 'vet-reports', true);

-- Allow anyone to read vet report PDFs
CREATE POLICY "Anyone can view vet reports"
ON storage.objects FOR SELECT
USING (bucket_id = 'vet-reports');

-- Allow anyone to upload vet reports (since app has no auth)
CREATE POLICY "Anyone can upload vet reports"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vet-reports');
