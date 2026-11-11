import { environment, database, mercadoPago, json, withCors } from '../lib/billing.mjs';

// Só divulga o estado geral da integração, nunca chaves ou dados de usuários.
async function handler(request) {
  if (request.method !== 'GET') return json({ ready: false }, 405);
  const required = ['FIREBASE_PROJECT_ID', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'MP_ACCESS_TOKEN', 'MP_WEBHOOK_SECRET', 'MP_ENVIRONMENT'];
  const missing = required.filter(name => !process.env[name]);
  if (missing.length) return json({ ready: false, reason: 'configuration', missing }, 503);
  try {
    environment();
  } catch { return json({ ready: false, reason: 'configuration' }, 503); }
  try {
    await database('billing_accounts?select=user_id&limit=0');
    await database('billing_payments?select=id,mp_order_id,mp_updated_at&limit=0');
  } catch (error) { return json({ ready: false, reason: 'database', statusCode: error.backendStatus || null }, 503); }
  try { await mercadoPago('/users/me'); }
  catch { return json({ ready: false, reason: 'mercadopago' }, 503); }
  return json({ ready: true });
}
export default request => withCors(request, handler);
