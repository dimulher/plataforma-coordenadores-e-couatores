-- Adiciona coluna theme nos projetos para definir visual do link de convite
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'saopaulo'
  CHECK (theme IN ('saopaulo', 'portugal'));

-- Atualiza projetos existentes com base no nome
UPDATE public.projects SET theme = 'portugal'  WHERE lower(name) LIKE '%portugal%' OR lower(name) LIKE '%feira%';
UPDATE public.projects SET theme = 'saopaulo'  WHERE lower(name) LIKE '%paulo%'    OR lower(name) LIKE '%bienal%';
