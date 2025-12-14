
-- Drop old function and recreate with atomic record update logic
DROP FUNCTION IF EXISTS public.reset_accident_timer();

CREATE OR REPLACE FUNCTION public.reset_accident_timer()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  old_date TIMESTAMPTZ;
  old_record INTEGER;
  elapsed_days INTEGER;
  new_record INTEGER;
  new_timestamp TIMESTAMPTZ;
  result JSONB;
BEGIN
  new_timestamp := now();
  
  -- Lock the row and get current values atomically
  SELECT last_accident_date, record_days 
  INTO old_date, old_record
  FROM public.accident_config 
  WHERE id = 1 
  FOR UPDATE;
  
  -- Calculate elapsed days since last accident
  elapsed_days := EXTRACT(EPOCH FROM (new_timestamp - old_date)) / 86400;
  
  -- Determine new record: max(current_record, elapsed_days)
  new_record := GREATEST(old_record, elapsed_days);
  
  -- Update with new timestamp and potentially new record
  UPDATE public.accident_config
  SET last_accident_date = new_timestamp,
      record_days = new_record,
      updated_at = new_timestamp
  WHERE id = 1;
  
  -- Log the reset event
  INSERT INTO public.timer_reset_history (previous_days)
  VALUES (elapsed_days);
  
  -- Return result for client
  result := jsonb_build_object(
    'new_timestamp', new_timestamp,
    'previous_days', elapsed_days,
    'old_record', old_record,
    'new_record', new_record,
    'record_broken', new_record > old_record
  );
  
  RETURN result;
END;
$function$;
