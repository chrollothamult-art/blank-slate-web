-- Create default admin user
-- Note: This creates a user with the credentials:
-- Email: admin@bookhaven.com
-- Password: admin123

-- Insert the default admin user into auth.users
-- The password hash is for "admin123"
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'admin@bookhaven.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin","full_name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Add admin role to the default admin user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin')
ON CONFLICT DO NOTHING;

-- Add admin profile
INSERT INTO public.profiles (id, username, full_name)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin', 'Admin User')
ON CONFLICT (id) DO NOTHING;