-- ============================================================
-- Corrigir login: inserir identity em auth.identities
-- O Supabase exige uma linha em auth.identities para cada usuário
-- criado manualmente, senão o login falha com "Database error"
-- ============================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'jorge.lider@nab.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário jorge.lider@nab.com não encontrado em auth.users';
  END IF;

  -- Remove identity anterior quebrada (se existir)
  DELETE FROM auth.identities WHERE user_id = v_user_id;

  -- Cria a identity obrigatória para login com email/senha
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at,
    provider_id
  ) VALUES (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'jorge.lider@nab.com'),
    'email',
    NOW(),
    NOW(),
    NOW(),
    v_user_id::text
  );

  RAISE NOTICE 'Identity criada para jorge.lider@nab.com (user_id: %)', v_user_id;
END $$;
