-- Create function to reset accident timer using server time
CREATE OR REPLACE FUNCTION public.reset_accident_timer()
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_timestamp TIMESTAMPTZ;
BEGIN
  new_timestamp := now();
  
  UPDATE public.accident_config
  SET last_accident_date = new_timestamp,
      updated_at = new_timestamp
  WHERE id = 1;
  
  RETURN new_timestamp;
END;
$$;