-- Adiciona colunas para cadastro completo de coordenadores
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cpf          TEXT,
  ADD COLUMN IF NOT EXISTS social_name  TEXT,
  ADD COLUMN IF NOT EXISTS address_number TEXT;

-- Observação: phone, cep e address já existem na migration 20260305_add_profile_fields.sql
