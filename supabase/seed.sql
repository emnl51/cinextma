insert into auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
)
values (
  '00000000-0000-0000-0000-000000000001',
  'test@test.com',
  crypt('test1234', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'::jsonb,
  false,
  'authenticated'
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  jsonb_build_object(
    'sub',
    '00000000-0000-0000-0000-000000000001',
    'email',
    'test@test.com'
  ),
  'email',
  'test@test.com',
  now(),
  now(),
  now()
)
on conflict (id) do nothing;

insert into browser.profiles (id, username, created_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'test@test.com',
  now()
)
on conflict (id) do nothing;
