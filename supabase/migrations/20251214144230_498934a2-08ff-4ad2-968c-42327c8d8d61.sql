-- Create table for timer reset history
CREATE TABLE public.timer_reset_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    previous_days INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timer_reset_history ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reset history
CREATE POLICY "Anyone can read reset history"
ON public.timer_reset_history
FOR SELECT
USING (true);

-- Allow anyone to insert reset history
CREATE POLICY "Anyone can insert reset history"
ON public.timer_reset_history
FOR INSERT
WITH CHECK (true);