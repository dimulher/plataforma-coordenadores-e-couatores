-- ============================================================
-- Configurar perfil do Jorge Líder após criação pelo Dashboard
-- Rodar DEPOIS de criar o usuário no Supabase Auth Dashboard
-- ============================================================

DO $$
DECLARE
  v_user_id  UUID;
  v_gestor_id UUID;
BEGIN
  -- Busca o UUID do usuário criado pelo Dashboard
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jorge.lider@nab.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Crie o usuário pelo Dashboard primeiro (Authentication > Users > Add user)';
  END IF;

  -- Busca o GESTOR (Jefferson Santos)
  SELECT id INTO v_gestor_id
  FROM profiles
  WHERE role = 'GESTOR'
  LIMIT 1;

  -- Atualiza ou cria o perfil com role LIDER
  INSERT INTO profiles (id, email, name, role, manager_id, tenant_id)
  VALUES (
    v_user_id,
    'jorge.lider@nab.com',
    'Jorge Líder',
    'LIDER',
    v_gestor_id,
    'tenant-1'
  )
  ON CONFLICT (id) DO UPDATE SET
    name       = 'Jorge Líder',
    role       = 'LIDER',
    manager_id = v_gestor_id,
    tenant_id  = 'tenant-1';

  -- Garante que o metadata do auth user tem o role correto
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"name":"Jorge Líder","role":"LIDER"}'::jsonb
  WHERE id = v_user_id;

  RAISE NOTICE 'Perfil configurado: jorge.lider@nab.com | Role: LIDER | gestor_id: %', v_gestor_id;
END $$;
