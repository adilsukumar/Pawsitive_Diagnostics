
-- Table to store dog profile snapshots for vet QR sharing
CREATE TABLE public.vet_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_name text,
  dog_breed text,
  dog_age text,
  dog_weight text,
  dog_photo text,
  scan_history jsonb DEFAULT '[]'::jsonb,
  emotion_logs jsonb DEFAULT '[]'::jsonb,
  sensor_readings jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Public read access (anyone with the link can view)
ALTER TABLE public.vet_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view vet shares"
ON public.vet_shares
FOR SELECT
USING (true);

-- Anyone can create shares (app has no auth)
CREATE POLICY "Anyone can create vet shares"
ON public.vet_shares
FOR INSERT
WITH CHECK (true);
