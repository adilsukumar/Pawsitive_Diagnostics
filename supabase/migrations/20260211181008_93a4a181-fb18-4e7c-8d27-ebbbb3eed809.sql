-- Add expires_at column with default 7 days from now
ALTER TABLE public.vet_shares
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days');

-- Enable pg_cron and pg_net for scheduled cleanup
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to delete expired vet shares and their PDF files
CREATE OR REPLACE FUNCTION public.cleanup_expired_vet_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete expired vet share records
  DELETE FROM public.vet_shares WHERE expires_at < now();
END;
$$;

-- Schedule cleanup to run every hour
SELECT cron.schedule(
  'cleanup-expired-vet-shares',
  '0 * * * *',
  $$SELECT public.cleanup_expired_vet_shares()$$
);