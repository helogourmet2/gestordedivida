// ─── Supabase Edge Function: keep-alive ──────────────────────────────────────
// Função simples para manter o projeto Supabase ativo (evita pausar por inatividade)
// Deploy: supabase functions deploy keep-alive --project-ref xdskhspqrqeraqnshuey
// IMPORTANTE: Esta função deve ser pública (sem autenticação)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  // Permitir CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  const timestamp = new Date().toISOString();
  
  console.log(`[Keep-Alive] Ping recebido em ${timestamp}`);
  
  return new Response(
    JSON.stringify({
      status: 'alive',
      timestamp,
      message: 'Supabase project is active',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
});
