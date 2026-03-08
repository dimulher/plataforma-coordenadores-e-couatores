-- Migration: coordinator_tables
-- Creates leads, payments, coordinator_activities tables with RLS
-- Adds coordinator RLS to profiles and chapters

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  email         text,
  phone         text,
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'NOVO'
                  CHECK (status IN ('NOVO','CONTATO','REUNIAO','CONTRATO','CONVERTIDO','DESISTIU')),
  notes         text,
  tenant_id     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coordinator_own_leads_select" ON leads FOR SELECT USING (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_leads_insert" ON leads FOR INSERT WITH CHECK (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_leads_update" ON leads FOR UPDATE USING (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_leads_delete" ON leads FOR DELETE USING (coordinator_id = auth.uid());

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coauthor_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  lead_id            uuid REFERENCES leads(id) ON DELETE SET NULL,
  project_id         uuid REFERENCES projects(id) ON DELETE SET NULL,
  contract_amount    numeric(12,2) NOT NULL DEFAULT 0,
  commission_amount  numeric(12,2) NOT NULL DEFAULT 0,
  commission_status  text NOT NULL DEFAULT 'pendente' CHECK (commission_status IN ('pendente','pago')),
  paid_at            timestamptz,
  description        text,
  tenant_id          text,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coordinator_own_payments_select" ON payments FOR SELECT USING (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_payments_insert" ON payments FOR INSERT WITH CHECK (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_payments_update" ON payments FOR UPDATE USING (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_payments_delete" ON payments FOR DELETE USING (coordinator_id = auth.uid());

-- COORDINATOR_ACTIVITIES
CREATE TABLE IF NOT EXISTS coordinator_activities (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coordinator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coauthor_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action         text NOT NULL,
  details        text,
  type           text NOT NULL DEFAULT 'observation' CHECK (type IN ('observation','message','edit','status_change')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coordinator_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coordinator_own_activities_select" ON coordinator_activities FOR SELECT USING (coordinator_id = auth.uid());
CREATE POLICY "coordinator_own_activities_insert" ON coordinator_activities FOR INSERT WITH CHECK (coordinator_id = auth.uid());
