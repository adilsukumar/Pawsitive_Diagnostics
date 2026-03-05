
-- Create emotion_logs table for tracking dog emotions throughout the day
CREATE TABLE public.emotion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emotion TEXT NOT NULL CHECK (emotion IN ('happy', 'anxious', 'playful', 'sad', 'scared')),
  confidence INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own emotion logs" ON public.emotion_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own emotion logs" ON public.emotion_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own emotion logs" ON public.emotion_logs FOR DELETE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_emotion_logs_user_created ON public.emotion_logs (user_id, created_at DESC);
