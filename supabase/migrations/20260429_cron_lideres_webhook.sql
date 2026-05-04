-- =============================================================
-- Cron: enviar líderes para webhook n8n amanhã às 10h (BRT = 13h UTC)
-- Execute no Supabase SQL Editor
-- =============================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job anterior se existir
SELECT cron.unschedule('send-lideres-webhook')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'send-lideres-webhook'
);

-- Agendar disparo único: 2026-04-30 às 10h BRT (13h UTC)
SELECT cron.schedule(
  'send-lideres-webhook',
  '0 13 30 4 *',
  $$
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
  $$
);

-- Após disparar, remover o job (one-shot manual via segundo cron logo depois)
SELECT cron.schedule(
  'cleanup-lideres-webhook',
  '5 13 30 4 *',
  $$
    SELECT cron.unschedule('send-lideres-webhook');
    SELECT cron.unschedule('cleanup-lideres-webhook');
  $$
);

DO $$ BEGIN
  RAISE NOTICE '✓ Cron agendado: 2026-04-30 às 10h BRT (13h UTC)';
  RAISE NOTICE '✓ Webhook: https://n8n.prosperamentor.com.br/webhook/4e40dda1-31a3-4c30-ba27-f15e3ff37fa6';
  RAISE NOTICE '✓ Job se auto-remove após disparar';
END $$;
