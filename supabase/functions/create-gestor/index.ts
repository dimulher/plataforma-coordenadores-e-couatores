import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Chamada pelo n8n quando um gestor é aprovado/contratado ─────────────────
//
// POST /functions/v1/create-gestor
//
// Body esperado (JSON):
// {
//   "name":           "Nome completo",       // obrigatório
//   "email":          "gestor@email.com",    // obrigatório
//   "phone":          "11999999999",         // opcional
//   "cpf":            "000.000.000-00",      // opcional
//   "social_name":    "Nome Social",         // opcional
//   "cep":            "00000-000",           // opcional
//   "address":        "Rua Exemplo, 123",    // opcional
//   "address_number": "Sala 5",              // opcional
//   "tenant_id":      "tenant-1",            // opcional (default: tenant-1)
//   "password":       "SenhaCustom@123"      // opcional (default: Mudar123@)
// }
//
// Response 201:
// {
//   "success": true,
//   "user_id": "uuid",
//   "email": "gestor@email.com",
//   "temp_password": "Mudar123@",
//   "message": "Gestor criado com sucesso"
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
      phone,
      cpf,
      social_name,
      cep,
      address,
      address_number,
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

    const tempPassword = password || 'Mudar123@';

    // ── 1. Criar usuário no Supabase Auth ─────────────────────────────────────
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role: 'LIDER' },
    });

    if (authError) {
      const msg = authError.message.includes('already been registered')
        ? `Email ${email} já está cadastrado na plataforma`
        : authError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // ── 2. Inserir profile com role GESTOR ────────────────────────────────────
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id:             userId,
        name,
        email,
        role:           'LIDER',
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

    // ── 3. Retorno ────────────────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        success:       true,
        user_id:       userId,
        email,
        temp_password: tempPassword,
        message:       `Líder ${name} criado com sucesso`,
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
