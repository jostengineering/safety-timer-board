-- Drop the restrictive policy
DROP POLICY IF EXISTS "Authenticated users can update accident config" ON public.accident_config;

-- Create a permissive policy that allows anyone to update
CREATE POLICY "Anyone can update accident config" 
ON public.accident_config 
FOR UPDATE 
USING (true)
WITH CHECK (true);