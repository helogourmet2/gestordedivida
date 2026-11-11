import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('jose', () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: async token => {
    if (token !== 'valid-token') throw new Error('bad token');
    const now = Math.floor(Date.now() / 1000);
    return { payload: { sub: 'user-1', email: 'user@example.com', email_verified: true, iat: now, auth_time: now } };
  },
}));
import statusHandler from '../../netlify/functions/billing-status.mjs';
import checkoutHandler from '../../netlify/functions/billing-checkout.mjs';
import webhookHandler from '../../netlify/functions/mercadopago-webhook.mjs';

const account = { trial_started_at: '2026-11-10T00:00:00Z', trial_ends_at: '2099-02-10T00:00:00Z' };
const attempt = { id: '5f1eb5c0-b520-4400-9a97-cd0184a87773', user_id: 'user-1', environment: 'production', expires_at: '2099-01-01T00:00:00Z' };
function request(endpoint, method = 'GET', token = 'valid-token') {
  return new Request(`https://app.example/.netlify/functions/${endpoint}`, { method, headers: { authorization: `Bearer ${token}` } });
}
function reply(body) { return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }); }
beforeEach(() => {
  vi.stubEnv('FIREBASE_PROJECT_ID', 'project'); vi.stubEnv('SUPABASE_URL', 'https://db.example');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'server-secret'); vi.stubEnv('MP_ACCESS_TOKEN', 'mp-secret');
  vi.stubEnv('MP_WEBHOOK_SECRET', 'webhook-secret'); vi.stubEnv('MP_ENVIRONMENT', 'production');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('rejects invalid sessions before contacting the database', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  expect((await statusHandler(request('billing-status', 'GET', 'invalid'))).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});
it('returns the server trial for the verified user only', async () => {
  const fetch = vi.fn(async url => {
    if (url.includes('/rpc/billing_start_trial')) return reply([account]);
    return reply([]);
  }); vi.stubGlobal('fetch', fetch);
  const result = await (await statusHandler(request('billing-status'))).json();
  expect(result.allowed).toBe(true); expect(result.lifetime).toBe(false);
  expect(JSON.parse(fetch.mock.calls[0][1].body).p_user_id).toBe('user-1');
});
it('creates a Pix Orders request with a stable idempotency key and no client price', async () => {
  const fetch = vi.fn(async (url, options) => {
    if (url.endsWith('/rpc/billing_start_trial')) return reply([account]);
    if (url.includes('status=eq.approved')) return reply([]);
    if (url.endsWith('/rpc/billing_reserve_payment')) return reply([attempt]);
    if (url.endsWith('/v1/orders')) {
      expect(options.headers['X-Idempotency-Key']).toBe(attempt.id);
      expect(JSON.parse(options.body).total_amount).toBe('10.00');
      return reply({ id: 'ORD123ABC', external_reference: attempt.id, total_amount: '10.00', country_code: 'BRA', status: 'action_required', transactions: { payments: [{ amount: '10.00', payment_method: { id: 'pix', qr_code: 'PIX-CODE', qr_code_base64: 'BASE64' } }] } });
    }
    if (url.endsWith('/rpc/billing_record_order')) return reply(null);
    throw new Error(`Unexpected call ${url}`);
  }); vi.stubGlobal('fetch', fetch);
  const response = await checkoutHandler(request('billing-checkout', 'POST'));
  expect(response.status).toBe(200);
  expect((await response.json()).qrCode).toBe('PIX-CODE');
});
it('does not create another charge for an existing lifetime account', async () => {
  const fetch = vi.fn(async url => reply(url.includes('/rpc/billing_start_trial') ? [account] : [{ id: 'paid' }]));
  vi.stubGlobal('fetch', fetch);
  expect(await (await checkoutHandler(request('billing-checkout', 'POST'))).json()).toEqual({ lifetime: true });
  expect(fetch.mock.calls.some(([url]) => url.includes('api.mercadopago.com'))).toBe(false);
});
it('rejects forged webhooks without touching payment or access data', async () => {
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  expect((await webhookHandler(request('mercadopago-webhook', 'POST'))).status).toBe(401);
  expect(fetch).not.toHaveBeenCalled();
});
