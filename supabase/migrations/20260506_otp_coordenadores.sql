-- =============================================================
-- Gera OTP e atualiza senhas dos coordenadores existentes
-- Execute no Supabase SQL Editor
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------
-- 1. auth.users — atualiza senha com OTP gerado
-- -------------------------------------------------------
UPDATE auth.users SET encrypted_password = crypt('K7NX3QBH', gen_salt('bf')), updated_at = NOW() WHERE id = '04c9fef1-3e7a-4886-ac1e-b63a25c90237';
UPDATE auth.users SET encrypted_password = crypt('P4RMVZ9J', gen_salt('bf')), updated_at = NOW() WHERE id = '0f363f0b-2957-4e93-b0d6-9904c33a70aa';
UPDATE auth.users SET encrypted_password = crypt('WQ8FHXNT', gen_salt('bf')), updated_at = NOW() WHERE id = '26e4d3f6-389e-467f-b68b-0698378a7160';
UPDATE auth.users SET encrypted_password = crypt('3BYJM5KP', gen_salt('bf')), updated_at = NOW() WHERE id = '5f3009b3-3249-4d22-8aca-5bdeeaadceaa';
UPDATE auth.users SET encrypted_password = crypt('RVZG7N2Q', gen_salt('bf')), updated_at = NOW() WHERE id = '5f576761-e8c6-413c-a2fc-09fdbada5fa8';
UPDATE auth.users SET encrypted_password = crypt('HX4WTCPM', gen_salt('bf')), updated_at = NOW() WHERE id = '688b0441-8edd-4c55-a074-acefe15e1857';
UPDATE auth.users SET encrypted_password = crypt('9ZKBJ3VR', gen_salt('bf')), updated_at = NOW() WHERE id = '818a5fe8-e9b0-40bb-bba3-7c827395122c';
UPDATE auth.users SET encrypted_password = crypt('FMQT8H5N', gen_salt('bf')), updated_at = NOW() WHERE id = 'a294d962-6f64-495d-865c-d920898b7c72';

-- -------------------------------------------------------
-- 2. profiles — salva OTP em texto puro e reseta flag
-- -------------------------------------------------------
UPDATE public.profiles SET otp_password = 'K7NX3QBH', password_changed = false WHERE id = '04c9fef1-3e7a-4886-ac1e-b63a25c90237';
UPDATE public.profiles SET otp_password = 'P4RMVZ9J', password_changed = false WHERE id = '0f363f0b-2957-4e93-b0d6-9904c33a70aa';
UPDATE public.profiles SET otp_password = 'WQ8FHXNT', password_changed = false WHERE id = '26e4d3f6-389e-467f-b68b-0698378a7160';
UPDATE public.profiles SET otp_password = '3BYJM5KP', password_changed = false WHERE id = '5f3009b3-3249-4d22-8aca-5bdeeaadceaa';
UPDATE public.profiles SET otp_password = 'RVZG7N2Q', password_changed = false WHERE id = '5f576761-e8c6-413c-a2fc-09fdbada5fa8';
UPDATE public.profiles SET otp_password = 'HX4WTCPM', password_changed = false WHERE id = '688b0441-8edd-4c55-a074-acefe15e1857';
UPDATE public.profiles SET otp_password = '9ZKBJ3VR', password_changed = false WHERE id = '818a5fe8-e9b0-40bb-bba3-7c827395122c';
UPDATE public.profiles SET otp_password = 'FMQT8H5N', password_changed = false WHERE id = 'a294d962-6f64-495d-865c-d920898b7c72';

-- -------------------------------------------------------
-- 3. Confirmação — exibe tabela com email e OTP
-- -------------------------------------------------------
SELECT name, email, otp_password
FROM public.profiles
WHERE id IN (
  '04c9fef1-3e7a-4886-ac1e-b63a25c90237',
  '0f363f0b-2957-4e93-b0d6-9904c33a70aa',
  '26e4d3f6-389e-467f-b68b-0698378a7160',
  '5f3009b3-3249-4d22-8aca-5bdeeaadceaa',
  '5f576761-e8c6-413c-a2fc-09fdbada5fa8',
  '688b0441-8edd-4c55-a074-acefe15e1857',
  '818a5fe8-e9b0-40bb-bba3-7c827395122c',
  'a294d962-6f64-495d-865c-d920898b7c72'
)
ORDER BY name;
