// ─── Supabase Edge Function: send-debt-notifications ─────────────────────────
// Verifica dívidas vencendo hoje ou amanhã e dispara push via FCM
// Deploy: supabase functions deploy send-debt-notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_SERVER_KEY = Deno.env.get('FCM_SERVER_KEY')!; // Firebase → Configurações → Cloud Messaging → Chave do servidor

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async (req) => {
  try {
    const { user_id = 'vfk1471' } = await req.json().catch(() => ({}));

    // Buscar token FCM do usuário
    const { data: tokenData, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Token FCM não encontrado para o usuário' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fcmToken = tokenData.token;

    // Calcular datas de hoje e amanhã
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const todayISO = today.toISOString();
    const tomorrowISO = tomorrow.toISOString();
    const dayAfterISO = dayAfter.toISOString();

    // Buscar dívidas vencendo hoje ou amanhã (armazenadas no IndexedDB local,
    // mas replicadas no Supabase quando houver conexão — placeholder para sync futuro)
    // Por ora, a Edge Function é chamada pelo pg_cron e usa os dados do Supabase
    // quando a sincronização estiver implementada.

    // Montar notificações
    const notifications: Array<{ title: string; body: string; tag: string }> = [];

    // Dívidas vencidas (overdue) — exemplo de payload manual para teste
    // Quando a sync com Supabase estiver ativa, buscar da tabela de dívidas aqui

    // Por enquanto, enviar notificação de lembrete diário
    notifications.push({
      title: '📋 Gestor de Dívidas',
      body: 'Verifique suas dívidas para hoje e amanhã.',
      tag: 'daily-reminder',
    });

    // Disparar push via FCM para cada notificação
    const results = await Promise.allSettled(
      notifications.map((notif) => sendFCMPush(fcmToken, notif))
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ success: true, sent, failed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Edge Function] Erro:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// ─── Enviar push via FCM ──────────────────────────────────────────────────────
async function sendFCMPush(
  token: string,
  notification: { title: string; body: string; tag: string }
) {
  const payload = {
    to: token,
    notification: {
      title: notification.title,
      body: notification.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: notification.tag,
      click_action: '/',
    },
    data: {
      tag: notification.tag,
      url: '/',
    },
  };

  const res = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `key=${FCM_SERVER_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM error ${res.status}: ${text}`);
  }

  return await res.json();
}
