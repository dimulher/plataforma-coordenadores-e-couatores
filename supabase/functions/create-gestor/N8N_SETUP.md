# Setup n8n — Criação de Gestores

## Como funciona

Gestores não têm um "superior" dentro da plataforma (respondem diretamente ao ADMIN).
O fluxo n8n é mais simples: recebe os dados do gestor e chama a edge function.

```
Formulário/Webhook de entrada
        │
        ▼
   [n8n — Fluxo "Novo Gestor"]
        │
        ▼
   HTTP Request → Edge Function create-gestor
        │
        ▼
   Supabase: cria Auth user + profile GESTOR
        │
        ▼
   Notificação: envia acesso ao novo gestor
```

---

## Passo 1 — Deploy da Edge Function

```bash
supabase functions deploy create-gestor
```

URL da função:
```
https://cafxhrwafbtahftfpylq.supabase.co/functions/v1/create-gestor
```

---

## Passo 2 — Configurar o Fluxo n8n

### Nó 1: Trigger (Webhook, formulário ou aprovação manual)

Campos esperados:
- `name`, `email`, `phone`, `cpf`, `social_name`
- `cep`, `address`, `address_number`

### Nó 2: HTTP Request

| Campo | Valor |
|---|---|
| **Method** | `POST` |
| **URL** | `https://cafxhrwafbtahftfpylq.supabase.co/functions/v1/create-gestor` |
| **Authentication** | Header Auth |
| **Header Name** | `Authorization` |
| **Header Value** | `Bearer <SUPABASE_ANON_KEY>` |
| **Content-Type** | `application/json` |

**Body (JSON):**
```json
{
  "name":           "{{ $json.name }}",
  "email":          "{{ $json.email }}",
  "phone":          "{{ $json.phone }}",
  "cpf":            "{{ $json.cpf }}",
  "social_name":    "{{ $json.social_name }}",
  "cep":            "{{ $json.cep }}",
  "address":        "{{ $json.address }}",
  "address_number": "{{ $json.address_number }}",
  "tenant_id":      "tenant-1"
}
```

### Nó 3: Notificação (WhatsApp / Email)

Enviar ao novo gestor:
```
Olá {{ $json.name }},

Seu acesso à plataforma NAB foi criado!

🔗 Acesso: https://sua-plataforma.com/login
📧 Email: {{ $json.email }}
🔑 Senha temporária: {{ $json.temp_password }}

Acesse e altere sua senha no primeiro login.
```

---

## Resposta da Edge Function

**Sucesso (201):**
```json
{
  "success": true,
  "user_id": "uuid-do-novo-gestor",
  "email": "gestor@email.com",
  "temp_password": "Mudar123@",
  "message": "Gestor Nome criado com sucesso"
}
```

**Erro — email já cadastrado (400):**
```json
{
  "error": "Email gestor@email.com já está cadastrado na plataforma"
}
```

---

## Comparativo: os 3 fluxos de criação

| Função | Role criada | Precisa de | Quem aciona |
|---|---|---|---|
| `create-gestor` | GESTOR | — | n8n (fluxo único) |
| `create-coordinator` | COORDENADOR | `manager_id` do gestor | n8n (um fluxo por gestor) |
| `create-coautor` | COAUTOR | `coordinator_id` + pagamento | n8n (após pagamento confirmado) |

---

## Testando manualmente (cURL)

```bash
curl -X POST \
  https://cafxhrwafbtahftfpylq.supabase.co/functions/v1/create-gestor \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana Gestora",
    "email": "ana@teste.com",
    "phone": "11999999999",
    "tenant_id": "tenant-1"
  }'
```
