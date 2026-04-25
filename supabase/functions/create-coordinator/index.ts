import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Chamada pelo n8n quando um coordenador é aprovado ───────────────────────
//
// POST /functions/v1/create-coordinator
//
// Body esperado (JSON):
// {
//   "name":           "Nome completo",           // obrigatório
//   "email":          "coord@email.com",          // obrigatório
//   "manager_id":     "uuid-do-gestor",           // obrigatório — define a qual gestor pertence
//   "phone":          "11999999999",              // opcional
//   "cpf":            "000.000.000-00",           // opcional
//   "social_name":    "Nome Social",              // opcional
//   "cep":            "00000-000",               // opcional
//   "address":        "Rua Exemplo, 123",         // opcional
//   "address_number": "Apto 10",                 // opcional
//   "project_id":     "uuid-do-projeto",          // opcional
//   "tenant_id":      "tenant-1",                // opcional (default: tenant-1)
//   "password":       "SenhaCustom@123"           // opcional (default: Mudar123@)
// }
//
// Response 201:
// {
//   "success": true,
//   "user_id": "uuid",
//   "email": "coord@email.com",
//   "temp_password": "Mudar123@",
//   "message": "Coordenador criado com sucesso"
// }
// ─────────────────────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const body = await req.json();
    const {
      name,
      email,
      manager_id,
      phone,
      cpf,
      social_name,
      cep,
      address,
      address_number,
      project_id,
      tenant_id,
      password,
    } = body;

    // ── Validações ────────────────────────────────────────────────────────────
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'name e email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!manager_id) {
      return new Response(
        JSON.stringify({ error: 'manager_id é obrigatório — informe o UUID do gestor responsável' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se o gestor existe e tem role GESTOR ou ADMIN
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role')
      .eq('id', manager_id)
      .in('role', ['LIDER', 'GESTOR', 'ADMIN'])
      .single();

    if (managerError || !manager) {
      return new Response(
        JSON.stringify({ error: 'manager_id inválido ou usuário não é LIDER/ADMIN' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const tempPassword = password || 'Mudar123@';

    // ── 1. Criar usuário no Supabase Auth ─────────────────────────────────────
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role: 'COORDENADOR' },
    });

    if (authError) {
      // Se usuário já existe, retorna erro claro
      const msg = authError.message.includes('already been registered')
        ? `Email ${email} já está cadastrado na plataforma`
        : authError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // ── 2. Inserir profile com role COORDENADOR ───────────────────────────────
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id:             userId,
        name,
        email,
        role:           'COORDENADOR',
        manager_id:     manager_id,
        phone:          phone          || null,
        cpf:            cpf            || null,
        social_name:    social_name    || null,
        cep:            cep            || null,
        address:        address        || null,
        address_number: address_number || null,
        tenant_id:      tenant_id      || 'tenant-1',
        contract_status: 'ENVIADO',
      });

    if (profileError) {
      // Rollback: remover usuário auth criado
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 3. Vincular ao projeto se fornecido ───────────────────────────────────
    if (project_id) {
      const { error: participantError } = await supabaseAdmin
        .from('project_participants')
        .insert({ user_id: userId, project_id, role: 'COORDENADOR' });

      if (participantError) {
        console.error('Erro ao vincular projeto:', participantError.message);
        // Não faz rollback: coordenador já criado, apenas loga o erro
      }
    }

    // ── 4. Retorno ────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success:       true,
        user_id:       userId,
        email,
        temp_password: tempPassword,
        manager_id,
        manager_name:  manager.name,
        message:       `Coordenador criado com sucesso e vinculado ao gestor ${manager.name}`,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
