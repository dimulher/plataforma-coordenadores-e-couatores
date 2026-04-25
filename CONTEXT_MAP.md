# CONTEXT_MAP — Plataforma Novos Autores do Brasil (NAB)
> Documento de referência para LLMs. Atualizado em 2026-04-17. Stack: React 18 + Vite + Supabase + Tailwind.

---

## 1. Visão Geral

**O que o projeto faz:**
Plataforma editorial SaaS multi-role para gerenciar o programa Novos Autores do Brasil (NAB), que publica livros na Bienal do Livro. A plataforma cobre todo o ciclo: captação de autores → escrita de capítulos → revisão editorial → publicação.

**Stack principal:**
| Camada | Tecnologia |
|---|---|
| Frontend | React 18.3 + Vite 7 + React Router 7 |
| Estilização | Tailwind CSS 3.4 + inline `style` com tokens de cor |
| Componentes UI | shadcn/ui (Radix UI headless) + design system próprio (`brand.jsx`) |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Automação | n8n (webhook externo em `prosperamentor.com.br`) |
| Animações | framer-motion 11 |
| Gráficos | recharts 2.10 |
| Documentos | docx + html-docx-js (geração de .docx) |

**URL Supabase:** `https://cafxhrwafbtahftfpylq.supabase.co`

---

## 2. Hierarquia de Roles

```
ADMIN
  └── GESTOR (controla toda a distribuição: Líderes, Vendedores, CS)
        ├── LIDER (Líder de Coordenação — gerencia N coordenadores)
        │     └── COORDENADOR (gerencia N coautores + captação de leads)
        │           └── COAUTOR (escreve capítulo)
        ├── VENDEDOR (atende leads dos coordenadores de líderes atribuídos pelo Gestor)
        └── CS (Customer Success — acompanha todos os coautores)
```

| Role | Dashboard | Escopo de visibilidade |
|---|---|---|
| ADMIN | `/app/dashboard` | **Tudo** — todos os gestores, líderes, coordenadores e coautores |
| GESTOR | `/manager/dashboard` | Seus líderes + coordenadores desses líderes + vendedores + CS |
| LIDER | `/manager/dashboard` (mesma rota) | Seus coordenadores + coautores desses coordenadores |
| COORDENADOR | `/coordinator/dashboard` | Seus leads + seus coautores |
| COAUTOR | `/coauthor/dashboard` | Apenas seus próprios dados |
| CS | `/cs/dashboard` | Todos os coautores da plataforma + status dos capítulos |
| VENDEDOR | `/vendedor/dashboard` | Leads dos coordenadores dos líderes atribuídos pelo Gestor |

**Regras de visibilidade:**
- GESTOR vê **tudo** sob seu time: líderes, coordenadores, coautores, vendedores, leads
- LIDER vê apenas seus coordenadores e os coautores desses coordenadores
- VENDEDOR vê leads agrupados por Líder (cada líder = seção do kanban)
- GESTOR atribui VENDEDOR → LÍDER via tabela `vendedor_assignments` (interface: `/manager/vendedores`)
- CS vê todos os coautores e capítulos da plataforma (leitura)
- COAUTOR não vê nenhum dado de outros usuários

**Redirects pós-login:**
```js
COAUTOR     → /coauthor/dashboard
LIDER       → /manager/dashboard   // mesmo dashboard do gestor antigo
GESTOR      → /manager/dashboard   // gestor agora controla líderes
CS          → /cs/dashboard
VENDEDOR    → /vendedor/dashboard
COORDENADOR → /coordinator/dashboard
ADMIN       → /app/dashboard
```

> **Nota:** `isGestor()` no AuthContext é alias de `isLider()` (role='LIDER') por compatibilidade. O role 'GESTOR' foi renomeado para 'LIDER' no banco em 2026-04-17.

---

## 3. Arquitetura de Dados

### Tabelas principais

#### `profiles` — Todos os usuários
```
id (UUID PK), email, name, role (ADMIN|GESTOR|LIDER|CS|VENDEDOR|COORDENADOR|COAUTOR)
coordinator_id → profiles.id   // FK: coautor → seu coordenador
manager_id     → profiles.id   // FK: coordenador → seu LIDER; LIDER → seu GESTOR
tenant_id (TEXT, default 'tenant-1')
avatar_url, phone, cep, address, address_number, social_name, cpf
referral_code (TEXT)           // slug da landing page do coordenador
click_count (INT)
contract_status (ENVIADO | ASSINADO)
contract_signed_at, contract_url, website_url
```

#### `chapters` — Capítulos dos coautores
```
id, project_id → projects, author_id → profiles
title, content_text, word_count, word_goal (default 1500)
status: RASCUNHO | EM_EDICAO | AJUSTES_SOLICITADOS |
        ENVIADO_PARA_REVISAO | EM_REVISAO | APROVADO | PRODUCAO |
        FINALIZADO | CONCLUIDO
current_stage: Contrato | Revisão | Produção | Aprovação | Entrega
deadline, submitted_at, approved_at, created_at, updated_at
```

#### `chapter_versions` — Histórico de versões
```
id, chapter_id → chapters, author_id → profiles
type (TEXT: "Auto-save" | "Manual Save" | nome do status)
word_count, content (TEXT), created_at
```
> Máximo 15 versões por capítulo (lógica em `useChapterEditor.js`)

#### `reviewer_notes` — Notas do revisor
```
id, chapter_id → chapters
author_name (TEXT), text, resolved (BOOL), created_at
```

#### `projects`
```
id, name, type, status (ativo|inativo|concluido)
start_date, end_date, progress (0-100), created_at, updated_at
```

#### `project_participants`
```
id, project_id → projects, user_id → profiles
role (TEXT, default 'COAUTOR'), created_at
```

#### `leads` — Funil de vendas do coordenador
```
id, coordinator_id → profiles, name, email, phone
project_id → projects (nullable)
status: NOVO | CONTATO | QUALIFICADO | PROPOSTA | FECHADO | PERDIDO
notes, tenant_id, created_at, updated_at
```
> Quando lead é convertido em coautor, status → FECHADO via edge function.

#### `payments` — Comissões
```
id, coordinator_id → profiles, coauthor_id → profiles
lead_id → leads, project_id → projects
contract_amount, commission_amount (NUMERIC 12,2)
commission_status (pendente | pago), paid_at, description, tenant_id
```
> Pagamentos são originados por gateway externo (não implementado no frontend ainda).
> Quando o coautor finaliza a compra no gateway, o n8n detecta o pagamento confirmado e aciona a criação do coautor na plataforma.

#### `mentorships`
```
id, title, date (TIMESTAMPTZ), link, description, created_at
```
> Apenas ADMIN pode criar/editar/deletar. Todos os roles podem ler.

#### `announcements`
```
id, title, content, target_roles (text[], nullable), created_at
```
> `target_roles = NULL` significa "todos os roles".

#### `site_requests` — Solicitações de site de divulgação
```
id, coauthor_id → profiles (nullable), coordinator_id → profiles (nullable)
status: PENDENTE | EM_ANDAMENTO | CONCLUIDO | CANCELADO
notes, website_url, requested_at, updated_at
```
> Constraint: ao menos um de coauthor_id ou coordinator_id deve ser preenchido.

#### `coordinator_activities` — Log de ações do coordenador
```
id, coordinator_id → profiles, coauthor_id → profiles
action: OBSERVACAO_INTERNA | MENSAGEM_ENVIADA | CAPITULO_APROVADO | REVISAO_SOLICITADA
details (TEXT), type (observation|message|edit|status_change), created_at
```

#### `vendedor_assignments` — Atribuição de Vendedores a Líderes
```
id, vendedor_id → profiles (role=VENDEDOR), lider_id → profiles (role=LIDER)
UNIQUE(vendedor_id, lider_id)
```
> Gerenciado pelo GESTOR em `/manager/vendedores`. Um vendedor pode atender múltiplos líderes.

### Relacionamentos chave
```
GESTOR (manager_id na profile do LIDER)
  ├── LIDER (manager_id na profile do COORDENADOR)
  │     └── COORDENADOR
  │           ├── leads (coordinator_id)
  │           ├── payments (coordinator_id)
  │           ├── site_requests (coordinator_id)
  │           └── COAUTOR (coordinator_id na profile do COAUTOR)
  │                 ├── chapters (author_id)
  │                 ├── chapter_versions
  │                 └── reviewer_notes
  ├── VENDEDOR ←→ vendedor_assignments ←→ LIDER
  │     └── vê leads de todos os coordenadores dos líderes atribuídos
  └── CS
        └── vê todos os coautores e capítulos (leitura)
```

### RPC Functions (SECURITY DEFINER — bypassam RLS)
| Função | Chamada em | Propósito |
|---|---|---|
| `get_my_profile()` | AuthContext.jsx | Perfil do usuário logado |
| `get_all_coordinators_admin()` | AdminDashboard.jsx | Todos os coordenadores (admin) |
| `get_my_coordinators()` | GestorCoordinatorsPage, GestorFunnelPage | Coordenadores do LIDER logado |
| `get_team_stats()` | GestorCoordinatorsPage | Estatísticas agregadas da equipe |
| `get_team_leads()` | GestorFunnelPage | Leads dos coordenadores do LIDER |
| `get_all_agenda_links()` | GestorDashboard | Links de agenda/mentoria |
| `get_all_coauthors_admin()` | GestorDashboard | Todos os coautores (admin/lider) |
| `get_coordinator_info()` | CoauthorRegisterPage | Dados do coordenador pelo slug |
| `update_lead_status()` | GestorFunnelPage, VendedorLeadsPage | Atualiza status de lead (drag-drop) |
| `get_all_vendedores()` | GestorVendedoresPage | Todos os VENDEDOREs (gestor/admin) |
| `get_my_vendedor_assignments()` | GestorVendedoresPage | Atribuições vendedor↔líder do gestor |
| `get_my_leads_as_vendedor()` | VendedorLeadsPage, VendedorDashboard | Leads agrupados por líder para o vendedor |
| `get_all_coauthors_cs()` | CSDashboard, CSCoauthorsPage | Todos os coautores (CS/admin) |
| `get_all_chapters_cs()` | CSDashboard, CSCoauthorsPage | Todos os capítulos com nome do autor (CS/admin) |

---

## 4. Fluxos Principais

### 4.1 Fluxo de Registro

**Coautor (via link do coordenador):**
```
/register/coautor/:coordinatorId
  → Form: nome, email, telefone, instagram, profissão
  → INSERT leads (status='INDICADO') — NÃO cria Auth user ainda
  → Sucesso: botão WhatsApp (5511952138107) para "furar fila"
```
> Variante Bienal SP: `/register/autor-sp/:coordinatorId` (mesma lógica, tema verde/amarelo)

**Coordenador (via link do gestor):**
```
/register/coordinator/:managerId/:projectId?
  → Form: nome social, email, CPF, telefone, CEP, endereço
  → supabase.auth.signUp() → cria Auth user imediatamente
  → INSERT profiles (role='COORDENADOR', contract_status='ENVIADO')
  → INSERT project_participants
  → POST n8n webhook (dados + role:'COORDENADOR', status:'PENDING_CONTRACT')
  → Sucesso: "aguarde assinatura do contrato para acessar"
```

**Criação de LIDER via n8n (edge function create-gestor):**
```
[n8n — fluxo único "Novo Líder"]
  → POST /functions/v1/create-gestor
       body: { name, email, phone?, cpf?, cep?, address?, tenant_id? }
       → supabase.auth.admin.createUser() (senha: 'Mudar123@')
       → INSERT profiles (role='LIDER', contract_status='ENVIADO')
  → n8n envia acesso ao novo líder
```
> Após criação: o GESTOR vincula o LIDER ao seu time via UPDATE profiles SET manager_id = gestor_id.

**Criação de Coordenador via n8n (um fluxo por líder):**
```
[n8n — fluxo "Coordenadores — Líder X"] (manager_id = UUID do LIDER)
  → POST /functions/v1/create-coordinator
       body: { name, email, manager_id, phone?, cpf?, project_id?, ... }
       → Valida que manager_id existe com role LIDER, GESTOR ou ADMIN
       → supabase.auth.admin.createUser() (senha: 'Mudar123@')
       → INSERT profiles (role='COORDENADOR', contract_status='ENVIADO')
       → INSERT project_participants (se project_id fornecido)
  → n8n envia acesso ao novo coordenador
```
> UUIDs admin: Jorge Murilho `b4ecabac-ad7f-4ba6-9a5a-1ea49ebf4ca5`, Jefferson Santos `81dd18ad-ca5c-4e2e-b0a4-e467bdbf6105`

**Aprovação automática do Coautor via pagamento (fluxo n8n):**
```
[Gateway externo] → Pagamento confirmado
  → n8n detecta evento de pagamento
  → n8n chama Edge Function create-coautor:
       POST /functions/v1/create-coautor
       body: { name, email, phone, coordinator_id, project_id, ... }
       → supabase.auth.admin.createUser() (senha temporária: 'Mudar123@')
       → INSERT profiles (role='COAUTOR', contract_status='ENVIADO')
       → UPDATE leads SET status='FECHADO' WHERE email matches
       → INSERT project_participants
  → Coautor loga na plataforma → vê contrato para assinar
  → Após assinatura: contract_status = 'ASSINADO'
```
> **Importante:** NÃO chamar `create-coautor` manualmente. O n8n é o único acionador em produção.

### 4.2 Workflow Editorial (Capítulos)

```
RASCUNHO → EM_EDICAO → ENVIADO_PARA_REVISAO → EM_REVISAO
                ↑                                    |
        AJUSTES_SOLICITADOS ←──────────────────────┘
                                                     |
                                              APROVADO → PRODUCAO → FINALIZADO
```

**Auto-save:** `useChapterEditor.js` salva a cada 10s se houver alteração.
**Versões:** Mantém últimas 15. Tipo de versão registra o contexto ("Auto-save", "Enviado para revisão", etc.).

### 4.3 Funil de Leads — Pipeline Único (Gestor movimenta, Coordenador visualiza)

Os status da tabela `leads` e os status do funil do Gestor são **o mesmo pipeline**, não dois sistemas separados.

```
[GESTOR qualifica e avança]
INDICADO → CADASTRO_COMPLETO → EM_ATENDIMENTO → EM_AVALIACAO → APROVADO
                                                                    |
                                                         CONTRATO_ONBOARDING
                                                                    |
                                                  [Pagamento confirmado → n8n]
                                                                    |
                                                           COAUTOR_ATIVO
                                              NAO_APROVADO (saída em qualquer etapa)

[Status alternativos na tabela leads (visão do coordenador)]
NOVO → CONTATO → QUALIFICADO → PROPOSTA → FECHADO | PERDIDO
```

**Regra:** O GESTOR é quem move o lead no funil. O COORDENADOR vê os mesmos registros filtrados por `coordinator_id` com os status que o gestor definiu — não cria status paralelos.

### 4.4 Site de Divulgação (Coordenador)
```
CoordinatorDashboard → botão "Solicitar Site"
  → INSERT site_requests (status='PENDENTE')
  → Admin muda para EM_ANDAMENTO → CONCLUIDO
  → UPDATE profiles.website_url quando concluído
```

---

## 5. Integrações Externas

| Integração | Onde | URL/Config |
|---|---|---|
| **n8n webhook** | CoordinatorInvitePage.jsx | `https://n8n.prosperamentor.com.br/webhook/f78026cc-c11f-4120-b3c3-9f9c4b3aba26` |
| **WhatsApp** | CoauthorRegisterPage, CoauthorRegisterSPPage | `https://wa.me/5511952138107` |
| **Supabase Auth** | AuthContext | `cafxhrwafbtahftfpylq.supabase.co` |
| **Supabase Storage** | SettingsPage (avatar) | bucket `profiles` (path: `avatars/{user.id}.{ext}`) |

> **Atenção:** n8n URL e WhatsApp estão hardcoded no código. Deveriam ser `import.meta.env.*`.

---

## 6. Estado Atual das Funcionalidades

### ✅ Operacional (100%)
- Autenticação e login unificado com redirect por role (7 roles)
- Dashboard Admin (métricas, gráficos, analytics de leads)
- Dashboard Coordenador (KPIs, próximas entregas)
- Dashboard Coautor (capítulo ativo, jornada, mentoria)
- Editor de capítulo (autosave, versões, notas do revisor)
- Fluxo de aprovação coautor: admin envia arquivo corrigido → coautor aprova em 72h (auto-aprovação se expirar)
- Funil de leads do coordenador (kanban drag-drop)
- Cadastro de mentoria (admin CRUD, todos visualizam)
- Avisos com segmentação por role (`target_roles`)
- Solicitação de site de divulgação
- Registro de coautor via link do coordenador (Portugal + SP)
- Registro de coordenador via link do líder + n8n webhook
- Painel do Líder (coordenadores, funil, stats)
- Dashboard CS com funil editorial + tabela de coautores
- Dashboard Vendedor com leads agrupados por Líder (kanban drag-drop + relatório de atendimento)
- Gestão de vendedores pelo Gestor (atribuir/remover vendedores de líderes)
- Página de comissões do coordenador
- Ranking de coordenadores
- Link de captação do coordenador
- Revisão de capítulos pelo admin

### 🔄 Parcialmente Implementado
- **Storage de avatares**: lógica existe no frontend, mas bucket `profiles` precisa ser criado manualmente no Supabase
- **Fluxo de pagamento**: gateway externo existe mas integração frontend ainda não foi desenvolvida
- **Contrato digital**: tela existe no CoauthorDashboard, mas o trigger automático (pagamento → contrato aparece) depende do fluxo n8n

### 🚧 Páginas Ainda Não Desenvolvidas (usam localStorage como placeholder)
Estas páginas **existem como estrutura** mas ainda serão implementadas com dados reais do Supabase:
- `LeadsPage` (`/app/leads`)
- `RankingPage` (`/app/ranking`)
- `FinancePage` (`/app/finance`)
- `CommissionsPage`
- `AdminProjectDetailPage`
- `AlertsIndicator` (contagem de notificações)

> Ao implementar qualquer dessas páginas: **migrar de localStorage para Supabase**. Nunca usar localStorage para novas funcionalidades.

### ❌ Não Implementado / Stub
- "Esqueceu a senha?" — exibe `alert('🚧 Em desenvolvimento')`
- CoursePage — estrutura existe, conteúdo não
- Notificações em tempo real (AlertsIndicator conta items do localStorage)

---

## 7. Pendências Críticas

| # | Prioridade | Descrição |
|---|---|---|
| 1 | 🔴 Alta | Migrar `useAdminMetrics` e `useCoordinatorMetrics` de localStorage → Supabase queries reais |
| 2 | 🔴 Alta | Executar migration `supabase/migrations/20260305_patch_coautor.sql` para criar bucket `profiles` e padronizar RLS |
| 3 | 🟡 Média | Extrair URLs hardcoded (n8n, WhatsApp) para variáveis de ambiente (`VITE_N8N_WEBHOOK_URL`, `VITE_WHATSAPP_NUMBER`) |
| 4 | 🟡 Média | Remover `console.log` de produção em `AuthContext.jsx` (dados de perfil logados no browser) |
| 5 | 🟡 Média | `announcements.target_roles` coluna pode não existir — código faz fallback com `error.code === '42703'` |
| 6 | 🟢 Baixa | Implementar "Esqueceu a senha?" via Supabase Auth reset |
| 7 | 🟢 Baixa | `AdminProjectDetailPage` ainda usa localStorage — migrar para Supabase |

---

## 8. Sistema de Design (brand.jsx)

**Tokens de cor:**
```js
NAV   = '#001B36'  // Azul marinho escuro — estrutura, texto, bordas
BLUE  = '#3F7DB0'  // Azul médio — ações secundárias, foco
RED   = '#AC1B00'  // Vermelho — CTAs, logo, destaques
CREAM = '#F5F5D9'  // Creme — backgrounds grandes
```

**Componentes exportados:**
| Componente | Uso |
|---|---|
| `WelcomeBanner` | Banner de boas-vindas (fundo NAV, formas decorativas) |
| `BrandCard` | Card branco com borda `NAV` sutil e sombra |
| `BrandCardHeader` | Cabeçalho de card: ícone colorido + título + linha accent |
| `BtnPrimary` | Botão vermelho com sombra e hover |
| `BtnOutline` | Botão outline com cor customizável |
| `PageHeader` | Título bold + subtítulo opcional |

**Tipografia:**
- Headings: `Poppins, sans-serif`
- Body: `'Be Vietnam Pro', sans-serif`

**Padrão de hover em botões customizados:**
```jsx
onMouseEnter={e => { e.currentTarget.style.background = ...; }}
onMouseLeave={e => { e.currentTarget.style.background = ...; }}
```

**Padrão de spinner:**
```css
border: '2px solid transparent'
borderTopColor: BLUE (ou 'white' em botões coloridos)
animation: 'spin .7s linear infinite'
```

---

## 9. Convenções de Código

### Estrutura de arquivos
```
src/
  assets/          # Imagens (logo-simbolo.png)
  components/
    ui/            # Primitivos shadcn (button, card, dialog...)
    *.jsx          # Componentes de feature (AppLayout, ProtectedRoute, etc.)
  contexts/        # AuthContext.jsx
  hooks/           # use-toast, useChapterEditor, useCoordinatorData, etc.
  lib/
    brand.jsx      # Tokens + componentes de design
    brand.js       # Re-export (compatibilidade)
    supabase.js    # Cliente Supabase
    utils.js       # cn() helper
  pages/           # Uma página por arquivo
supabase/
  functions/       # Edge Functions (TypeScript/Deno)
  migrations/      # SQL migrations (prefixo YYYYMMDD_)
```

### Padrões de importação
```js
import { supabase }                              from '@/lib/supabase'
import { NAV, BLUE, RED, BrandCard, BtnPrimary } from '@/lib/brand'
import { useAuth }                               from '@/contexts/AuthContext'
import { useToast }                              from '@/hooks/use-toast'
import { Loader2 }                               from 'lucide-react'
```

### Padrão de página típica
```jsx
const MinhaPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tabela').select('...');
    if (!error) setData(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex justify-center">
      <Loader2 className="animate-spin" style={{ color: BLUE }} />
    </div>
  );

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <Helmet><title>Página — NAB</title></Helmet>
      <BrandCard>
        <BrandCardHeader icon={IconName} iconColor={BLUE} title="Título" />
        {/* conteúdo */}
      </BrandCard>
    </div>
  );
};
```

### Padrão de campos de formulário
```jsx
// Foco/blur inline (sem CSS externo)
onFocus={e => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px ${BLUE}18`; }}
onBlur={e  => { e.target.style.borderColor = `${NAV}18`; e.target.style.boxShadow = 'none'; }}
```

### Enums de status (strings exatas usadas no banco)
```
Chapter:  RASCUNHO | EM_EDICAO | AJUSTES_SOLICITADOS | ENVIADO_PARA_REVISAO |
          EM_REVISAO | APROVADO | PRODUCAO | FINALIZADO | CONCLUIDO
Lead:     NOVO | CONTATO | QUALIFICADO | PROPOSTA | FECHADO | PERDIDO
Funil:    INDICADO | CADASTRO_COMPLETO | EM_ATENDIMENTO | EM_AVALIACAO |
          APROVADO | CONTRATO_ONBOARDING | COAUTOR_ATIVO | NAO_APROVADO
SiteReq:  PENDENTE | EM_ANDAMENTO | CONCLUIDO | CANCELADO
Contract: ENVIADO | ASSINADO
Payment:  pendente | pago
```

---

## 10. Ambiente e Deploy

```bash
# Desenvolvimento
npm run dev      # Vite dev server

# Build
npm run build    # Gera /dist

# Variáveis de ambiente necessárias (.env)
VITE_SUPABASE_URL=https://cafxhrwafbtahftfpylq.supabase.co
VITE_SUPABASE_ANON_KEY=<jwt_anon>
```

**Edge Functions (Deno — deploy via Supabase CLI):**
```bash
supabase functions deploy create-gestor       # Cria GESTOR (n8n único fluxo)
supabase functions deploy create-coordinator  # Cria COORDENADOR (n8n um fluxo por gestor)
supabase functions deploy create-coautor      # Cria COAUTOR (n8n após pagamento)
```
> Documentação de setup n8n: `supabase/functions/create-gestor/N8N_SETUP.md` e `supabase/functions/create-coordinator/N8N_SETUP.md`

---

## 11. Mapa de Arquivos Críticos

| Arquivo | Importância | Descrição |
|---|---|---|
| `src/App.jsx` | ⭐⭐⭐ | Todas as rotas + guards de role |
| `src/contexts/AuthContext.jsx` | ⭐⭐⭐ | Login, logout, user state, role helpers |
| `src/lib/brand.jsx` | ⭐⭐⭐ | Tokens de cor + componentes de design |
| `src/hooks/useChapterEditor.js` | ⭐⭐⭐ | State machine do editor de capítulos |
| `src/hooks/useCoordinatorData.js` | ⭐⭐⭐ | Toda a lógica de dados do coordenador |
| `src/components/AppLayout.jsx` | ⭐⭐ | Sidebar + nav com filtros por role |
| `src/components/ProtectedRoute.jsx` | ⭐⭐ | Guard de autenticação e roles |
| `src/pages/LoginPage.jsx` | ⭐⭐ | Login unificado com redirect por role |
| `src/pages/CoordinatorDashboard.jsx` | ⭐⭐ | Principal página do coordenador |
| `src/pages/CoauthorDashboard.jsx` | ⭐⭐ | Principal página do coautor |
| `src/pages/AdminChapterReviewPage.jsx` | ⭐⭐ | Revisão editorial de capítulos |
| `supabase/functions/create-gestor/index.ts` | ⭐⭐ | Provisionamento de gestores via n8n |
| `supabase/functions/create-coordinator/index.ts` | ⭐⭐ | Provisionamento de coordenadores via n8n (requer manager_id) |
| `supabase/functions/create-coautor/index.ts` | ⭐⭐ | Provisionamento de coautores via n8n (após pagamento) |
| `supabase/migrations/` | ⭐⭐ | Schema completo do banco |
