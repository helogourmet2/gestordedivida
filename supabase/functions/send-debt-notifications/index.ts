// ─── Supabase Edge Function: send-debt-notifications ─────────────────────────
// Verifica dívidas vencendo hoje ou amanhã e dispara push via FCM API V1
// Deploy: supabase functions deploy send-debt-notifications

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { create, getNumericDate } from 'https://deno.land/x/djwt@v2.8/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Service Account do Firebase (armazenada como secret no Supabase)
const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') || 'gestor-dedividas';
const FCM_CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL')!;
const FCM_PRIVATE_KEY = Deno.env.get('FCM_PRIVATE_KEY')!; // chave PEM completa

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

    // Gerar access token OAuth2 via Service Account
    const accessToken = await getAccessToken();

    // Calcular datas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Montar notificações
    // Quando a sync com Supabase estiver ativa, buscar dívidas da tabela aqui.
    // Por ora, envia lembrete diário.
    const notifications = [
      {
        title: '📋 Gestor de Dívidas',
        body: 'Verifique suas dívidas para hoje e amanhã.',
        tag: 'daily-reminder',
      },
    ];

    const results = await Promise.allSettled(
      notifications.map((n) => sendFCMV1(accessToken, fcmToken, n))
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

// ─── Gerar Access Token OAuth2 via JWT (Service Account) ─────────────────────
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Importar a chave privada PEM
  const pemKey = FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
  const keyData = pemKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), (c) => c.charCodeAt(0));

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

  const payload = {
    message: {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      webpush: {
        notification: {
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: notification.tag,
          renotify: true,
          vibrate: [200, 100, 200],
        },
        fcm_options: {
          link: '/',
        },
      },
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM V1 error ${res.status}: ${text}`);
  }

  return await res.json();
}
