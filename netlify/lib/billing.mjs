import { createHmac, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'));
export const PRICE = 10;
export function env(name) {
  const value = process.env[name];
  if (!value) throw Object.assign(new Error('O pagamento ainda não foi configurado. Tente novamente mais tarde.'), { status: 503 });
  return value;
}
export function environment() {
  const value = env('MP_ENVIRONMENT');
  if (!['production', 'test'].includes(value)) throw new Error('Invalid billing environment');
  return value;
}
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
export function failure(error) {
  return json({ error: error.status ? error.message : 'Não foi possível concluir. Tente novamente em instantes.' }, error.status || 502);
}
export function requireMethod(request, method) {
  if (request.method !== method) throw Object.assign(new Error('Método não permitido.'), { status: 405 });
}
export async function authenticate(request) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw Object.assign(new Error('Entre na sua conta para continuar.'), { status: 401 });
  const project = env('FIREBASE_PROJECT_ID');
  try {
    const { payload } = await jwtVerify(token, jwks, { algorithms: ['RS256'], audience: project, issuer: `https://securetoken.google.com/${project}` });
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || payload.sub.length > 128 || !Number.isFinite(payload.iat) || payload.iat > now || !Number.isFinite(payload.auth_time) || payload.auth_time > now) throw new Error('Invalid token');
    return { uid: payload.sub, email: payload.email, emailVerified: payload.email_verified };
  } catch {
    throw Object.assign(new Error('Sua sessão expirou. Entre novamente.'), { status: 401 });
  }
}
export async function database(path, options = {}) {
  const key = env('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${env('SUPABASE_URL')}/rest/v1/${path}`, {
    ...options, signal: AbortSignal.timeout(12000),
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=representation', ...options.headers },
  });
  if (!response.ok) throw Object.assign(new Error('Billing database unavailable'), { backendStatus: response.status });
  return response.status === 204 ? null : response.json();
}
export async function mercadoPago(path, options = {}) {
  const response = await fetch(`https://api.mercadopago.com${path}`, {
    ...options, signal: AbortSignal.timeout(12000),
    headers: { Authorization: `Bearer ${env('MP_ACCESS_TOKEN')}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) throw new Error('Payment provider unavailable');
  return response.json();
}
export function validPayment(order, attempt, mode) {
  const payments = order.transactions?.payments || [];
  return String(order.external_reference) === attempt.id
    && (!attempt.mp_order_id || String(order.id) === attempt.mp_order_id)
    && Number(order.total_amount) === PRICE && order.country_code === 'BRA'
    && (!order.currency_id || order.currency_id === 'BRL')
    && payments.length === 1 && payments[0].payment_method?.id === 'pix'
    && Number(payments[0].amount) === PRICE
    && (order.live_mode === undefined || order.live_mode === (mode === 'production'));
}
export function paymentStatus(order) {
  const payment = order.transactions?.payments?.[0];
  if (order.status === 'processed' && order.status_detail === 'accredited'
      && payment?.status === 'processed' && payment.status_detail === 'accredited'
      && Number(order.total_paid_amount) === PRICE && Number(payment.paid_amount) === PRICE) return 'approved';
  if (order.status === 'action_required') return 'pending';
  if (order.status === 'processing') return 'in_process';
  return order.status === 'processed' ? 'unconfirmed' : order.status;
}
export async function recordPayment(order, attempt) {
  if (!validPayment(order, attempt, attempt.environment)) throw new Error('Payment mismatch');
  const updatedAt = order.last_updated_date || order.created_date || '1970-01-01T00:00:00Z';
  await database('rpc/billing_record_order', {
    method: 'POST', body: JSON.stringify({ p_attempt_id: attempt.id, p_order_id: String(order.id), p_status: paymentStatus(order), p_updated_at: updatedAt }),
  });
}
export async function startTrial(uid) {
  const rows = await database('rpc/billing_start_trial', { method: 'POST', body: JSON.stringify({ p_user_id: uid }) });
  return rows[0];
}
export function accessStatus(account, paid, now = new Date()) {
  const lifetime = paid.length > 0;
  const remaining = Math.max(0, Math.ceil((new Date(account.trial_ends_at) - now) / 86400000));
  return { lifetime, allowed: lifetime || new Date(account.trial_ends_at) > now, trialStartedAt: account.trial_started_at, trialEndsAt: account.trial_ends_at, daysRemaining: remaining, price: PRICE };
}
export function verifyWebhook(request, secret) {
  const id = new URL(request.url).searchParams.get('data.id');
  const requestId = request.headers.get('x-request-id');
  const signature = Object.fromEntries((request.headers.get('x-signature') || '').split(',').map(part => part.trim().split('=')));
  if (!id || !/^ORD[a-z0-9]+$/i.test(id) || !requestId || !/^\d+$/.test(signature.ts || '') || !/^[a-f0-9]{64}$/i.test(signature.v1 || '')) return false;
  const expected = createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${signature.ts};`).digest();
  return timingSafeEqual(expected, Buffer.from(signature.v1, 'hex'));
}

// Apenas os domínios do aplicativo podem chamar a API pelo navegador.
const allowedOrigins = new Set([
  'https://gestor-dedividas.web.app',
  'https://gestor-dedividas.firebaseapp.com',
  'https://guileless-baklava-7ff1a1.netlify.app',
]);
export async function withCors(request, handler) {
  const origin = request.headers.get('origin');
  if (origin && !allowedOrigins.has(origin)) return json({ error: 'Origem não permitida.' }, 403);
  const response = request.method === 'OPTIONS' ? new Response(null, { status: 204 }) : await handler(request);
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    response.headers.set('Access-Control-Max-Age', '600');
    response.headers.set('Vary', 'Origin');
  }
  return response;
}
