-- =============================================================
-- NUCLEAR FIX: REMOÇÃO TOTAL DE RECURSÃO RLS
-- EXECUTE ESTE BLOCO COMPLETO NO SQL EDITOR
-- =============================================================

-- 1. Limpeza total de policies na tabela profiles
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', pol.policyname);
    END LOOP;
END $$;

-- 2. Função de Cargo via JWT (Seguro e sem recursão)
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role')::text;
$$;

-- 3. Função de verificação de hierarquia (SECURITY DEFINER)
-- Isso evita que o RLS entre em loop ao checar o time do gestor
CREATE OR REPLACE FUNCTION is_manager_of(target_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = target_uid 
    AND (
      manager_id = auth.uid() -- Alvo é coordenador direto dele
      OR 
      coordinator_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid()) -- Alvo é coautor de um coord dele
    )
  );
$$;

-- 4. Re-implementação das Rules de PROFILES (Blindadas)

-- Cadastro: permite que o usuário crie seu próprio perfil
CREATE POLICY "profiles_insert_self" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Visualização: Próprio perfil
CREATE POLICY "profiles_select_self" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Visualização: Admin vê tudo
CREATE POLICY "profiles_select_admin" 
ON profiles FOR SELECT 
USING (get_my_role() = 'ADMIN');

-- Visualização: Gestor/Coordenador ver subordinados (via função segura)
CREATE POLICY "profiles_select_hierarchy" 
ON profiles FOR SELECT 
USING (is_manager_of(id));

-- Edição: Própria ou Admin
CREATE POLICY "profiles_update_owner_admin" 
ON profiles FOR UPDATE 
USING (auth.uid() = id OR get_my_role() = 'ADMIN');

-- 5. Garante que RLS está ligado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
