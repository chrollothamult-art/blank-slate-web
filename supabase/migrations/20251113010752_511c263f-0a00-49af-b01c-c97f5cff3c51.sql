-- Create function to verify password
CREATE OR REPLACE FUNCTION public.verify_password(stored_hash text, input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;