-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create simple admin table
CREATE TABLE IF NOT EXISTS public.admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin ENABLE ROW LEVEL SECURITY;

-- Allow anyone to verify login (needed for login function)
CREATE POLICY "Allow login verification" ON public.admin
  FOR SELECT
  USING (true);

-- Insert default admin (email: admin@thouart.com, password: admin123)
INSERT INTO public.admin (email, password_hash)
VALUES ('admin@thouart.com', crypt('admin123', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;