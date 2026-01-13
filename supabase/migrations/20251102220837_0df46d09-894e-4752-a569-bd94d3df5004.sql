-- Enable RLS on existing users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own user record"
  ON public.users FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own user record"
  ON public.users FOR UPDATE
  USING (auth.uid()::text = id::text);