-- RPC pública para primeiro acesso — confirma se email existe e tem OTP pendente
-- NÃO retorna o OTP (segurança): o n8n busca e envia internamente via service key
CREATE OR REPLACE FUNCTION public.get_profile_for_first_access(p_email TEXT)
RETURNS TABLE (
  id                UUID,
  name              TEXT,
  has_pending_otp   BOOLEAN,
  password_changed  BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    name,
    (otp_password IS NOT NULL AND otp_password <> '') AS has_pending_otp,
    password_changed
  FROM public.profiles
  WHERE lower(email) = lower(p_email)
    AND role = 'COORDENADOR'
  LIMIT 1;
$$;

-- Permitir chamada por usuários não autenticados (anon key)
GRANT EXECUTE ON FUNCTION public.get_profile_for_first_access(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_profile_for_first_access(TEXT) TO authenticated;
