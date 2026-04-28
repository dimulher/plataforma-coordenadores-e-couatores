import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.17';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') ?? '03d19904ceb36c67b946548892fbd19e';
const BUCKET     = Deno.env.get('R2_BUCKET')     ?? 'fotoscoautores';
const ACCESS_KEY = Deno.env.get('R2_ACCESS_KEY_ID') ?? '';
const SECRET_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '';
const PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') ?? 'https://pub-d2c6c0c22f3b4cbc964ab20cf2beecd9.r2.dev';

function sanitizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const authorName = form.get('name') as string | null;

    if (!file || !authorName) {
      return new Response(JSON.stringify({ error: 'file e name são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
    const key = `${sanitizeName(authorName)}.${ext}`;

    const aws = new AwsClient({
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_KEY,
      region: 'auto',
      service: 's3',
    });

    const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${key}`;
    const buffer = await file.arrayBuffer();

    const r2Res = await aws.fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'image/jpeg' },
      body: buffer,
    });

    if (!r2Res.ok) {
      const text = await r2Res.text();
      return new Response(JSON.stringify({ error: `R2 upload falhou: ${text}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = `${PUBLIC_URL}/${key}`;
    return new Response(JSON.stringify({ url, key }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
