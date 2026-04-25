-- ============================================================
-- DIAGNÓSTICO: verificar estado do usuário Jorge Líder
-- Cole este SQL no SQL Editor e verifique os resultados
-- ============================================================

-- 1. Verificar se o usuário existe em auth.users
SELECT id, email, email_confirmed_at, created_at,
       confirmation_token, recovery_token,
       is_sso_user, is_anonymous, deleted_at,
       raw_user_meta_data->>'role' AS meta_role
FROM auth.users
WHERE email = 'jorge.lider@nab.com';

-- 2. Verificar se o perfil existe em profiles
SELECT id, email, name, role, manager_id, tenant_id
FROM profiles
WHERE email = 'jorge.lider@nab.com';

-- 3. Verificar se os IDs coincidem (deve retornar 1 linha com os dois IDs iguais)
SELECT a.id AS auth_id, p.id AS profile_id,
       (a.id = p.id) AS ids_match
FROM auth.users a
FULL OUTER JOIN profiles p ON p.email = a.email
WHERE a.email = 'jorge.lider@nab.com'
   OR p.email = 'jorge.lider@nab.com';

-- 4. Verificar se existe trigger em auth.users que pode estar causando conflito
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- 5. Verificar função get_my_profile existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'get_my_profile';
