-- ============================================================
-- Criar usuário de teste: Coordenador + Coautor
-- Coordenador vinculado ao LIDER d8b72ded-d4d7-4e2e-a338-f24d299a3f63
-- Coautor vinculado ao Coordenador criado
-- ============================================================

DO $$
DECLARE
  v_coord_id   UUID := gen_random_uuid();
  v_coautor_id UUID := gen_random_uuid();
  v_lider_id   UUID := 'd8b72ded-d4d7-4e2e-a338-f24d299a3f63';
BEGIN

  -- ── Limpar usuários anteriores (se já existirem) ──────────
  DELETE FROM auth.identities WHERE user_id IN (
    SELECT id FROM auth.users WHERE email IN ('coordenador.teste@gmail.com', 'coautor.teste@gmail.com')
  );
  DELETE FROM profiles   WHERE email IN ('coordenador.teste@gmail.com', 'coautor.teste@gmail.com');
  DELETE FROM auth.users WHERE email IN ('coordenador.teste@gmail.com', 'coautor.teste@gmail.com');

  -- ════════════════════════════════════════════════════════
  -- 1. COORDENADOR
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    v_coord_id,
    '00000000-0000-0000-0000-000000000000',
    'coordenador.teste@gmail.com',
    crypt('Coordenador@2026', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Coordenador Teste","role":"COORDENADOR"}'::jsonb,
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', false, false
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(), v_coord_id,
    jsonb_build_object('sub', v_coord_id::text, 'email', 'coordenador.teste@gmail.com'),
    'email', NOW(), NOW(), NOW(),
    'coordenador.teste@gmail.com'
  );

  INSERT INTO profiles (id, email, name, role, manager_id, tenant_id, contract_status)
  VALUES (
    v_coord_id,
    'coordenador.teste@gmail.com',
    'Coordenador Teste',
    'COORDENADOR',
    v_lider_id,
    'tenant-1',
    'ASSINADO'
  );

  -- ════════════════════════════════════════════════════════
  -- 2. COAUTOR vinculado ao Coordenador acima
  -- ════════════════════════════════════════════════════════
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, role, aud,
    confirmation_token, recovery_token,
    email_change_token_new, email_change_token_current, reauthentication_token,
    is_sso_user, is_anonymous
  ) VALUES (
    v_coautor_id,
    '00000000-0000-0000-0000-000000000000',
    'coautor.teste@gmail.com',
    crypt('Coautor@2026', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"name":"Coautor Teste","role":"COAUTOR"}'::jsonb,
    NOW(), NOW(), 'authenticated', 'authenticated',
    '', '', '', '', '', false, false
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at, provider_id
  ) VALUES (
    gen_random_uuid(), v_coautor_id,
    jsonb_build_object('sub', v_coautor_id::text, 'email', 'coautor.teste@gmail.com'),
    'email', NOW(), NOW(), NOW(),
    'coautor.teste@gmail.com'
  );

  INSERT INTO profiles (id, email, name, role, coordinator_id, tenant_id, contract_status)
  VALUES (
    v_coautor_id,
    'coautor.teste@gmail.com',
    'Coautor Teste',
    'COAUTOR',
    v_coord_id,
    'tenant-1',
    'ASSINADO'
  );

  RAISE NOTICE '✓ Coordenador criado: coordenador.teste@gmail.com | Senha: Coordenador@2026 | id: %', v_coord_id;
  RAISE NOTICE '✓ Coautor criado:     coautor.teste@gmail.com     | Senha: Coautor@2026     | coordinator_id: %', v_coord_id;
END $$;
