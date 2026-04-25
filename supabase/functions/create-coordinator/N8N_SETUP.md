# Setup n8n — Criação de Coordenadores por Gestor

## Como funciona

Uma única Edge Function (`create-coordinator`) recebe o `manager_id` no body.
Cada gestor tem seu próprio **fluxo n8n separado**, com o `manager_id` fixo no nó de requisição.
Assim, ao receber um formulário/pagamento de coordenador, o n8n já sabe a qual gestor vincular.

```
Formulário/Webhook de entrada
        │
        ▼
   [n8n — Fluxo do Gestor X]
        │  (manager_id fixo = UUID do gestor)
        ▼
   HTTP Request → Edge Function create-coordinator
        │
        ▼
   Supabase: cria Auth user + profile COORDENADOR vinculado ao gestor
```

---

## Passo 1 — Deploy da Edge Function

No terminal, dentro da pasta do projeto:

```bash
supabase functions deploy create-coordinator
```

A URL da função será:
```
https://cafxhrwafbtahftfpylq.supabase.co/functions/v1/create-coordinator
```

---

## Passo 2 — Descobrir os UUIDs dos Gestores

No Supabase SQL Editor:
```sql
SELECT id, name, email, role
FROM profiles
WHERE role IN ('GESTOR', 'ADMIN')
ORDER BY name;
```

Anote o UUID de cada gestor. Você vai usar como `manager_id` no n8n.

---

## Passo 3 — Configurar o Fluxo n8n (um por gestor)

### Nó 1: Trigger (Webhook ou formulário de entrada)
Recebe os dados do coordenador. Campos esperados:
- `name`, `email`, `phone`, `cpf`, `social_name`
- `cep`, `address`, `address_number`

### Nó 2: HTTP Request
Configure assim:

| Campo | Valor |
|---|---|
| **Method** | `POST` |
| **URL** | `https://cafxhrwafbtahftfpylq.supabase.co/functions/v1/create-coordinator` |
| **Authentication** | Header Auth |
| **Header Name** | `Authorization` |
| **Header Value** | `Bearer <SUPABASE_ANON_KEY>` |
| **Content-Type** | `application/json` |

**Body (JSON):**
```json
{
  "name":           "{{ $json.name }}",
  "email":          "{{ $json.email }}",
  "manager_id":     "UUID-FIXO-DO-GESTOR-AQUI",
  "phone":          "{{ $json.phone }}",
  "cpf":            "{{ $json.cpf }}",
  "social_name":    "{{ $json.social_name }}",
  "cep":            "{{ $json.cep }}",
  "address":        "{{ $json.address }}",
  "address_number": "{{ $json.address_number }}",
  "project_id":     "{{ $json.project_id }}",
  "tenant_id":      "tenant-1"
}
```

> **⚠️ Substitua `UUID-FIXO-DO-GESTOR-AQUI`** pelo UUID real do gestor responsável por este fluxo.
> Cada fluxo n8n tem um gestor diferente fixo neste campo.

### Nó 3: Notificação (opcional)
Enviar WhatsApp/email para o coordenador com:
- Email de acesso: `{{ $json.email }}`
- Senha temporária: `{{ $json.temp_password }}`
- Link da plataforma: `https://sua-plataforma.com/login`

---

## Exemplo de fluxos separados por gestor

| Fluxo n8n | manager_id fixo | Gestor |
|---|---|---|
| `Coordenadores — Gestor Jorge` | `b4ecabac-ad7f-4ba6-9a5a-1ea49ebf4ca5` | Jorge Murilho |
| `Coordenadores — Gestor Jefferson` | `81dd18ad-ca5c-4e2e-b0a4-e467bdbf6105` | Jefferson Santos |

---

## Resposta da Edge Function

**Sucesso (201):**
```json
{
  "success": true,
  "user_id": "uuid-do-novo-coordenador",
  "email": "coord@email.com",
  "temp_password": "Mudar123@",
  "manager_id": "uuid-do-gestor",
  "manager_name": "Jorge Murilho",
  "message": "Coordenador criado com sucesso e vinculado ao gestor Jorge Murilho"
}
```

**Erro (400):**
```json
{
  "error": "Email coord@email.com já está cadastrado na plataforma"
}
```

---

## Variáveis de ambiente necessárias na Edge Function

Já são injetadas automaticamente pelo Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nenhuma configuração extra necessária.

---

## Testando manualmente (cURL)

```bash
curl -X POST \
  https://cafxhrwafbtahftfpylq.supabase.co/functions/v1/create-coordinator \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Coordenadora",
    "email": "maria@teste.com",
    "manager_id": "b4ecabac-ad7f-4ba6-9a5a-1ea49ebf4ca5",
    "phone": "11999999999",
    "tenant_id": "tenant-1"
  }'
```
