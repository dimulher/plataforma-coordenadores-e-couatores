-- ============================================================
-- Campos de Identidade do Autor (bio, redes sociais, foto capítulo)
-- Rodar no Supabase SQL Editor
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio               TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram         TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email     TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chapter_photo_url TEXT;

-- Recriar get_my_profile para incluir todas as colunas (SELECT *)
DROP FUNCTION IF EXISTS get_my_profile();
CREATE FUNCTION get_my_profile()
RETURNS SETOF profiles
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM profiles WHERE id = auth.uid();
$$;

DO $$ BEGIN
  RAISE NOTICE '✓ Colunas bio, instagram, contact_email, chapter_photo_url adicionadas a profiles';
  RAISE NOTICE '✓ get_my_profile recriada com SELECT *';
END $$;
