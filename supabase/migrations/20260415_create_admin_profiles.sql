-- ============================================================
-- Migration: Criar perfis de ADMIN
-- Data: 2026-04-15
-- Descrição: Insere os dois perfis de administrador da plataforma NAB.
--
-- PRÉ-REQUISITO:
--   Os usuários devem existir em auth.users com os UUIDs abaixo.
--   Se ainda não existem, crie-os primeiro no Supabase Dashboard:
--     Authentication → Users → "Add user" (ou "Invite user")
--   Use os mesmos UUIDs e emails abaixo.
--
-- COMO EXECUTAR:
--   Supabase Dashboard → SQL Editor → colar e executar este script.
-- ============================================================

INSERT INTO public.profiles (
  id,
  email,
  name,
  role,
  tenant_id,
  contract_status,
  created_at
)
VALUES
  (
    'b4ecabac-ad7f-4ba6-9a5a-1ea49ebf4ca5',
    'institutojorgemurilho@gmail.com',
    'Jorge Murilho',
    'ADMIN',
    'tenant-1',
    'ASSINADO',
    NOW()
  ),
  (
    '81dd18ad-ca5c-4e2e-b0a4-e467bdbf6105',
    'financeiro.jorgemurilho@gmail.com',
    'Jefferson Santos',
    'ADMIN',
    'tenant-1',
    'ASSINADO',
    NOW()
  )
ON CONFLICT (id) DO UPDATE
  SET
    email           = EXCLUDED.email,
    name            = EXCLUDED.name,
    role            = EXCLUDED.role,
    tenant_id       = EXCLUDED.tenant_id,
    contract_status = EXCLUDED.contract_status;

-- Verificação: deve retornar 2 linhas com role = 'ADMIN'
SELECT id, name, email, role, created_at
FROM public.profiles
WHERE id IN (
  'b4ecabac-ad7f-4ba6-9a5a-1ea49ebf4ca5',
  '81dd18ad-ca5c-4e2e-b0a4-e467bdbf6105'
);
