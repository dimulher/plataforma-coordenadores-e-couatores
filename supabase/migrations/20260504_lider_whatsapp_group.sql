-- Adiciona coluna de link do grupo WhatsApp para LIDERs
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- Adiciona coluna whatsapp pessoal para identidade do coautor/coordenador
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Controle de troca de senha no primeiro acesso
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS password_changed BOOLEAN DEFAULT FALSE;

-- OTP temporário enviado ao coordenador no cadastro
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS otp_password TEXT;
