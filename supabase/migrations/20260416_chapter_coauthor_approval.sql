-- ============================================================
-- Adiciona suporte ao fluxo de aprovação do coautor após revisão
-- O admin envia o capítulo corrigido → coautor tem 72h para aprovar
-- ============================================================

ALTER TABLE chapters
  ADD COLUMN IF NOT EXISTS corrected_file_url         TEXT,
  ADD COLUMN IF NOT EXISTS coauthor_approval_deadline TIMESTAMPTZ;

-- Verificação
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'chapters'
  AND column_name IN ('corrected_file_url', 'coauthor_approval_deadline');
