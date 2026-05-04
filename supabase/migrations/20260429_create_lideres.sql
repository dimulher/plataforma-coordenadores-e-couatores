-- =============================================================
-- Criar Líderes de Coordenação — Shírley, Tatiane, Suzilei
-- Senha inicial: Nab2026
-- Execute no Supabase SQL Editor
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------
-- 1. auth.users — cria ou atualiza com senha Nab2026
-- -------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
(
  '00000000-0000-0000-0000-000000000000',
  '54d64da2-8e63-477a-ab19-e33b67d6f084',
  'authenticated', 'authenticated',
  'shirleyfariafreitas@gmail.com',
  crypt('Nab2026', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"LIDER"}',
  '2026-03-03 13:22:33+00', NOW(),
  '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  '8e527aa5-3be4-4b6d-8453-497b7e58650a',
  'authenticated', 'authenticated',
  'tati.siltt@gmail.com',
  crypt('Nab2026', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"LIDER"}',
  '2026-03-05 12:01:22+00', NOW(),
  '', '', '', ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'f8613ae6-73f2-4a79-be6b-e0f763bef997',
  'authenticated', 'authenticated',
  'suzileip@gmail.com',
  crypt('Nab2026', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"LIDER"}',
  '2026-03-03 12:21:26+00', NOW(),
  '', '', '', ''
)
ON CONFLICT (id) DO UPDATE SET
  encrypted_password  = crypt('Nab2026', gen_salt('bf')),
  raw_user_meta_data  = '{"role":"LIDER"}',
  email               = EXCLUDED.email,
  updated_at          = NOW();

-- -------------------------------------------------------
-- 2. profiles — cria ou atualiza com role LIDER
-- -------------------------------------------------------
INSERT INTO public.profiles (id, name, email, role, tenant_id, created_at)
VALUES
(
  '54d64da2-8e63-477a-ab19-e33b67d6f084',
  'Shírley Freitas',
  'shirleyfariafreitas@gmail.com',
  'LIDER',
  'tenant-1',
  '2026-03-03 13:22:33+00'
),
(
  '8e527aa5-3be4-4b6d-8453-497b7e58650a',
  'Tatiane Gonçalves',
  'tati.siltt@gmail.com',
  'LIDER',
  'tenant-1',
  '2026-03-05 12:01:22+00'
),
(
  'f8613ae6-73f2-4a79-be6b-e0f763bef997',
  'Suzilei Pereira Guidio',
  'suzileip@gmail.com',
  'LIDER',
  'tenant-1',
  '2026-03-03 12:21:26+00'
)
ON CONFLICT (id) DO UPDATE SET
  name  = EXCLUDED.name,
  email = EXCLUDED.email,
  role  = 'LIDER';

DO $$ BEGIN
  RAISE NOTICE '✓ Shírley Freitas criada como LIDER';
  RAISE NOTICE '✓ Tatiane Gonçalves criada como LIDER';
  RAISE NOTICE '✓ Suzilei Pereira Guidio criada como LIDER';
  RAISE NOTICE '✓ Senha inicial: Nab2026';
END $$;
