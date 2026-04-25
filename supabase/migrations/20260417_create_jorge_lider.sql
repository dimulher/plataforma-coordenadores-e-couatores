-- ============================================================
-- Criar usuário Jorge Líder (LIDER de Coordenação)
-- Vinculado ao GESTOR Jefferson Santos
-- ============================================================

DO $$
DECLARE
  new_id     UUID := gen_random_uuid();
  gestor_id  UUID;
BEGIN
  -- Busca o UUID do GESTOR (Jefferson Santos)
  SELECT id INTO gestor_id
  FROM profiles
  WHERE role = 'GESTOR'
  LIMIT 1;

  -- Cria o usuário na tabela de autenticação do Supabase
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
    aud
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
    'authenticated'
  );

  -- Cria o perfil na tabela profiles
  INSERT INTO profiles (id, email, name, role, manager_id, tenant_id)
  VALUES (
    new_id,
    'jorge.lider@nab.com',
    'Jorge Líder',
    'LIDER',
    gestor_id,
    'tenant-1'
  );

  RAISE NOTICE 'Usuário criado: jorge.lider@nab.com | Senha: JorgeLider@2026 | manager_id: %', gestor_id;
END $$;
