// ─── Supabase Edge Function: send-debt-notifications ─────────────────────────
// Verifica dívidas vencendo hoje ou amanhã e dispara push via FCM API V1
// Deploy: supabase functions deploy send-debt-notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') || 'gestor-dedividas';
const FCM_CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL')!;
const FCM_PRIVATE_KEY = Deno.env.get('FCM_PRIVATE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

serve(async () => {
  try {
    // Data de hoje e amanhã (UTC)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Buscar todos os tokens FCM registrados
    const { data: tokens, error: tokenError } = await supabase
      .from('fcm_tokens')
      .select('user_id, token');

    if (tokenError || !tokens?.length) {
      return new Response(JSON.stringify({ error: 'Nenhum token FCM encontrado' }), { status: 404 });
    }

    // Buscar dívidas vencendo hoje ou amanhã (não pagas)
    const { data: debts, error: debtError } = await supabase
      .from('debts')
      .select('user_id, name, amount, due_date')
      .eq('is_paid', false)
      .in('due_date', [todayStr, tomorrowStr]);

    if (debtError) {
      return new Response(JSON.stringify({ error: debtError.message }), { status: 500 });
    }

    if (!debts?.length) {
      return new Response(JSON.stringify({ message: 'Nenhuma dívida vencendo hoje ou amanhã' }), { status: 200 });
    }

    // Agrupar dívidas por usuário
    const debtsByUser: Record<string, typeof debts> = {};
    for (const debt of debts) {
      if (!debtsByUser[debt.user_id]) debtsByUser[debt.user_id] = [];
      debtsByUser[debt.user_id].push(debt);
    }

    const accessToken = await getAccessToken();
    let totalSent = 0;
    let totalFailed = 0;

    // Para cada usuário com dívidas, buscar token e enviar push
    for (const [userId, userDebts] of Object.entries(debtsByUser)) {
      const tokenRow = tokens.find(t => t.user_id === userId);
      if (!tokenRow) continue;

      // Separar dívidas de hoje e amanhã
      const todayDebts = userDebts.filter(d => d.due_date === todayStr);
      const tomorrowDebts = userDebts.filter(d => d.due_date === tomorrowStr);

      const formatBRL = (v: number) =>
        v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

      const notifications = [];

      if (todayDebts.length === 1) {
        notifications.push({
          title: '⚠️ Dívida vence HOJE!',
          body: `${todayDebts[0].name} — ${formatBRL(todayDebts[0].amount)}`,
          tag: `today-${todayDebts[0].name}`,
        });
      } else if (todayDebts.length > 1) {
        const total = todayDebts.reduce((s, d) => s + d.amount, 0);
        notifications.push({
          title: `⚠️ ${todayDebts.length} dívidas vencem HOJE!`,
          body: `Total: ${formatBRL(total)} — Abra o app para ver`,
          tag: 'today-multiple',
        });
      }

      if (tomorrowDebts.length === 1) {
        notifications.push({
          title: '📅 Dívida vence amanhã',
          body: `${tomorrowDebts[0].name} — ${formatBRL(tomorrowDebts[0].amount)}`,
          tag: `tomorrow-${tomorrowDebts[0].name}`,
        });
      } else if (tomorrowDebts.length > 1) {
        const total = tomorrowDebts.reduce((s, d) => s + d.amount, 0);
        notifications.push({
          title: `📅 ${tomorrowDebts.length} dívidas vencem amanhã`,
          body: `Total: ${formatBRL(total)} — Abra o app para ver`,
          tag: 'tomorrow-multiple',
        });
      }

      const results = await Promise.allSettled(
        notifications.map(n => sendFCMV1(accessToken, tokenRow.token, n))
      );

      totalSent += results.filter(r => r.status === 'fulfilled').length;
      totalFailed += results.filter(r => r.status === 'rejected').length;
    }

    return new Response(
      JSON.stringify({ success: true, sent: totalSent, failed: totalFailed }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[Edge Function] Erro:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});

// ─── OAuth2 via Service Account ───────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const pemKey = FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
  const keyData = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const jwt = await create(
    { alg: 'RS256', typ: 'JWT' },
    {
      iss: FCM_CLIENT_EMAIL,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: getNumericDate(0),
      exp: getNumericDate(3600),
    },
    cryptoKey
  );

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) throw new Error(`OAuth2 error: ${await res.text()}`);
  const { access_token } = await res.json();
  return access_token;
}

// ─── Enviar push via FCM API V1 ───────────────────────────────────────────────
async function sendFCMV1(
  accessToken: string,
  token: string,
  notification: { title: string; body: string; tag: string }
) {
  const url = `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: notification.title, body: notification.body },
        webpush: {
          notification: {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: notification.tag,
            renotify: true,
            vibrate: [200, 100, 200],
          },
          fcm_options: { link: '/' },
        },
      },
    }),
  });

  if (!res.ok) throw new Error(`FCM V1 error ${res.status}: ${await res.text()}`);
  return await res.json();
}
