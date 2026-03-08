import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      cep,
      address,
      coordinator_id,
      project_id,
      tenant_id,
      // Senha temporária gerada pelo sistema externo ou definida aqui
      password,
    } = body;

    // Validações básicas
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: 'name e email são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Usar senha fornecida ou senha padrão conhecida
    const tempPassword = password || 'Mudar123@';

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // 2. Inserir profile na tabela profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name,
        email,
        phone: phone || null,
        cep: cep || null,
        address: address || null,
        role: 'COAUTOR',
        coordinator_id: coordinator_id || null,
        tenant_id: tenant_id || 'tenant-1',
      });

    if (profileError) {
      // Rollback: deletar usuário auth criado
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Marcar lead como FECHADO se existir com esse email
    await supabaseAdmin
      .from('leads')
      .update({ status: 'FECHADO' })
      .eq('email', email);

    // 4. Vincular ao projeto se fornecido
    if (project_id) {
      const { error: participantError } = await supabaseAdmin
        .from('project_participants')
        .insert({ user_id: userId, project_id });

      if (participantError) {
        console.error('Erro ao vincular projeto:', participantError.message);
        // Não faz rollback: usuário criado, apenas log do erro
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userId,
        email,
        temp_password: tempPassword,
        message: 'Coautor criado com sucesso',
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
