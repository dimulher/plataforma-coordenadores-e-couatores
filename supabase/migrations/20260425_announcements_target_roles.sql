-- Adiciona coluna target_roles à tabela announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS target_roles TEXT[];
