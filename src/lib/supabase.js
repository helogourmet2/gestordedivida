// ─── Supabase Client ──────────────────────────────────────────────────────────
// Preencha com suas credenciais do Supabase após criar o projeto
// https://supabase.com → Settings → API

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

// Salvar token FCM no Supabase para notificações push com app fechado
export async function saveFCMToken(token, userId = 'vfk1471') {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Credenciais não configuradas. Configure o .env');
    return;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/fcm_tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        user_id: userId,
        token,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) throw new Error(await res.text());
    console.log('[Supabase] Token FCM salvo com sucesso');
  } catch (err) {
    console.error('[Supabase] Erro ao salvar token FCM:', err);
  }
}
