import { requireMethod, verifyWebhook, env, environment, mercadoPago, database, recordPayment, json, failure } from '../lib/billing.mjs';

export default async function handler(request) {
  try {
    requireMethod(request, 'POST');
    if (!verifyWebhook(request, env('MP_WEBHOOK_SECRET'))) return json({ error: 'Assinatura inválida.' }, 401);
    const url = new URL(request.url);
    if (url.searchParams.get('type') !== 'order') return json({ received: true });
    const id = url.searchParams.get('data.id');
    const order = await mercadoPago(`/v1/orders/${encodeURIComponent(id)}`);
    if (!/^[a-f0-9-]{36}$/i.test(order.external_reference || '')) return json({ received: true });
    const rows = await database(`billing_payments?id=eq.${encodeURIComponent(order.external_reference)}&environment=eq.${environment()}`);
    if (!rows.length) return json({ received: true });
    await recordPayment(order, rows[0]);
    return json({ received: true });
  } catch (error) { return failure(error); }
}
