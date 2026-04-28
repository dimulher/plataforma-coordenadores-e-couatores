-- ============================================================
-- Configurar perfis após criação pelo Dashboard
-- Rodar DEPOIS de criar ambos os usuários no Supabase Auth
-- ============================================================

DO $$
DECLARE
  v_coord_id   UUID;
  v_coautor_id UUID;
  v_lider_id   UUID := 'd8b72ded-d4d7-4e2e-a338-f24d299a3f63';
BEGIN

  SELECT id INTO v_coord_id   FROM auth.users WHERE lower(email) = 'coordenador.teste@gmail.com';
  SELECT id INTO v_coautor_id FROM auth.users WHERE lower(email) = 'coautor.teste@gmail.com';

  IF v_coord_id IS NULL THEN
    RAISE EXCEPTION 'Usuário coordenador.teste@gmail.com não encontrado. Crie pelo Dashboard primeiro.';
  END IF;
  IF v_coautor_id IS NULL THEN
    RAISE EXCEPTION 'Usuário coautor.teste@gmail.com não encontrado. Crie pelo Dashboard primeiro.';
  END IF;

  -- Perfil do Coordenador
  INSERT INTO profiles (id, email, name, role, manager_id, tenant_id, contract_status)
  VALUES (v_coord_id, 'coordenador.teste@gmail.com', 'Coordenador Teste', 'COORDENADOR', v_lider_id, 'tenant-1', 'ASSINADO')
  ON CONFLICT (id) DO UPDATE SET
    name = 'Coordenador Teste', role = 'COORDENADOR',
    manager_id = v_lider_id, tenant_id = 'tenant-1', contract_status = 'ASSINADO';

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"name":"Coordenador Teste","role":"COORDENADOR"}'::jsonb
  WHERE id = v_coord_id;

  -- Perfil do Coautor
  INSERT INTO profiles (id, email, name, role, coordinator_id, tenant_id, contract_status)
  VALUES (v_coautor_id, 'coautor.teste@gmail.com', 'Coautor Teste', 'COAUTOR', v_coord_id, 'tenant-1', 'ASSINADO')
  ON CONFLICT (id) DO UPDATE SET
    name = 'Coautor Teste', role = 'COAUTOR',
    coordinator_id = v_coord_id, tenant_id = 'tenant-1', contract_status = 'ASSINADO';

  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"name":"Coautor Teste","role":"COAUTOR"}'::jsonb
  WHERE id = v_coautor_id;

  RAISE NOTICE '✓ Coordenador configurado: % | manager_id: %', v_coord_id, v_lider_id;
  RAISE NOTICE '✓ Coautor configurado:     % | coordinator_id: %', v_coautor_id, v_coord_id;
END $$;
