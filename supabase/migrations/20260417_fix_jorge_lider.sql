-- ============================================================
-- Recriar usuário Jorge Líder com todos os campos obrigatórios
-- ============================================================

DO $$
DECLARE
  new_id     UUID := gen_random_uuid();
  gestor_id  UUID;
BEGIN
  -- Remove usuário anterior quebrado (se existir)
  DELETE FROM auth.users WHERE email = 'jorge.lider@nab.com';
  DELETE FROM profiles    WHERE email = 'jorge.lider@nab.com';

  -- Busca o UUID do GESTOR (Jefferson Santos)
  SELECT id INTO gestor_id
  FROM profiles
  WHERE role = 'GESTOR'
  LIMIT 1;

  -- Cria o usuário com TODOS os campos obrigatórios do Supabase Auth
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    reauthentication_token,
    is_sso_user,
    is_anonymous
  ) VALUES (
    new_id,
    '00000000-0000-0000-0000-000000000000',
    'jorge.lider@nab.com',
    crypt('JorgeLider@2026', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Jorge Líder","role":"LIDER"}'::jsonb,
    NOW(),
    NOW(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    '',
    '',
    false,
    false
  );

  -- Cria o perfil
  INSERT INTO profiles (id, email, name, role, manager_id, tenant_id)
  VALUES (
    new_id,
    'jorge.lider@nab.com',
    'Jorge Líder',
    'LIDER',
    gestor_id,
    'tenant-1'
  );

  RAISE NOTICE 'Usuário recriado: jorge.lider@nab.com | Senha: JorgeLider@2026 | manager_id: %', gestor_id;
END $$;
