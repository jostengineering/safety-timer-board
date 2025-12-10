-- Create table for accident configuration
CREATE TABLE public.accident_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  last_accident_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  record_days INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.accident_config ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read (public display)
CREATE POLICY "Anyone can read accident config" 
ON public.accident_config 
FOR SELECT 
USING (true);

-- Allow authenticated users to update (admin only in practice)
CREATE POLICY "Authenticated users can update accident config" 
ON public.accident_config 
FOR UPDATE 
TO authenticated
USING (true);

-- Insert initial row
INSERT INTO public.accident_config (id, last_accident_date, record_days)
VALUES (1, now(), 0);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.accident_config;