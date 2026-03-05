
CREATE TABLE public.sensor_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bark_spike integer,
  ammonia_ppm double precision,
  methane_ppm double precision,
  co2_ppm double precision,
  scratch_intensity double precision,
  diagnosis text,
  skin_status text,
  device_timestamp bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Disable RLS since ESP32 posts without authentication
ALTER TABLE public.sensor_readings DISABLE ROW LEVEL SECURITY;
