-- =============================================================
-- TESTE: dispara o webhook agora
-- Execute no Supabase SQL Editor
-- =============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT net.http_post(
  url     := 'https://n8n.prosperamentor.com.br/webhook/4e40dda1-31a3-4c30-ba27-f15e3ff37fa6',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body    := '{"name": "Shírley Freitas", "email": "shirleyfariafreitas@gmail.com", "role": "LIDER"}'::jsonb
);

SELECT net.http_post(
  url     := 'https://n8n.prosperamentor.com.br/webhook/4e40dda1-31a3-4c30-ba27-f15e3ff37fa6',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body    := '{"name": "Tatiane Gonçalves", "email": "tati.siltt@gmail.com", "role": "LIDER"}'::jsonb
);

SELECT net.http_post(
  url     := 'https://n8n.prosperamentor.com.br/webhook/4e40dda1-31a3-4c30-ba27-f15e3ff37fa6',
  headers := '{"Content-Type": "application/json"}'::jsonb,
  body    := '{"name": "Suzilei Pereira Guidio", "email": "suzileip@gmail.com", "role": "LIDER"}'::jsonb
);
