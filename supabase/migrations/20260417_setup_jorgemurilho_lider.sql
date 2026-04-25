-- ============================================================
-- 1. Excluir usuário jorge.lider@nab.com (criado via SQL, quebrado)
-- 2. Configurar Jorgemurilho@gmail.com como Jorge Líder (LIDER)
-- ============================================================

DO $$
DECLARE
  v_user_id   UUID;
  v_gestor_id UUID;
BEGIN

  -- ── Remover jorge.lider@nab.com ─────────────────────────────
  DELETE FROM auth.identities
  WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jorge.lider@nab.com');

  DELETE FROM profiles WHERE email = 'jorge.lider@nab.com';

  DELETE FROM auth.users WHERE email = 'jorge.lider@nab.com';

  RAISE NOTICE 'Usuário jorge.lider@nab.com removido.';

  -- ── Configurar Jorgemurilho@gmail.com ────────────────────────
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower('Jorgemurilho@gmail.com');

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário Jorgemurilho@gmail.com não encontrado em auth.users. Verifique o email exato no Dashboard.';
  END IF;

  -- Busca o GESTOR (Jefferson Santos)
  SELECT id INTO v_gestor_id
  FROM profiles
  WHERE role = 'GESTOR'
  LIMIT 1;

  -- Cria ou atualiza o perfil como Jorge Líder
  INSERT INTO profiles (id, email, name, role, manager_id, tenant_id)
  VALUES (
    v_user_id,
    'Jorgemurilho@gmail.com',
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

  -- Atualiza metadata para role aparecer no JWT
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"name":"Jorge Líder","role":"LIDER"}'::jsonb
  WHERE id = v_user_id;

  RAISE NOTICE 'Jorge Líder configurado: Jorgemurilho@gmail.com | user_id: % | gestor_id: %', v_user_id, v_gestor_id;
END $$;
