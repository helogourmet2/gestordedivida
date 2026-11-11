import { withCors, authenticate, requireMethod, startTrial, database, mercadoPago, recordPayment, environment, json, failure } from '../lib/billing.mjs';

export function checkoutBody(attempt, user, mode = 'production') {
  return {
    type: 'online', total_amount: '10.00', external_reference: attempt.id, processing_mode: 'automatic',
    transactions: { payments: [{ amount: '10.00', payment_method: { id: 'pix', type: 'bank_transfer' }, expiration_time: 'PT1H' }] },
    payer: { email: mode === 'test' ? 'test_payer@example.com' : user.email, ...(mode === 'test' ? { first_name: 'APRO' } : {}) },
  };
}
async function handler(request) {
  try {
    requireMethod(request, 'POST');
    const user = await authenticate(request);
    if (!user.email || !user.emailVerified) return json({ error: 'Confirme o e-mail da sua conta antes de pagar.' }, 400);
    await startTrial(user.uid);
    const mode = environment();
    const paid = await database(`billing_payments?user_id=eq.${encodeURIComponent(user.uid)}&environment=eq.${mode}&status=eq.approved&limit=1`);
    if (paid.length) return json({ lifetime: true });
    const [attempt] = await database('rpc/billing_reserve_payment', {
      method: 'POST', body: JSON.stringify({ p_user_id: user.uid, p_environment: mode }),
    });
    if (!attempt) throw new Error('Could not reserve payment');
    const order = attempt.mp_order_id
      ? await mercadoPago(`/v1/orders/${encodeURIComponent(attempt.mp_order_id)}`)
      : await mercadoPago('/v1/orders', { method: 'POST', headers: { 'X-Idempotency-Key': attempt.id }, body: JSON.stringify(checkoutBody(attempt, user, mode)) });
    // Respostas assíncronas podem ainda não conter os dados de pagamento.
    if (!order.transactions?.payments?.length) {
      if (String(order.external_reference) !== attempt.id || Number(order.total_amount) !== 10) throw new Error('Order mismatch');
      await database(`billing_payments?id=eq.${attempt.id}`, { method: 'PATCH', body: JSON.stringify({ mp_order_id: String(order.id), status: 'in_process' }) });
      return json({ processing: true });
    }
    await recordPayment(order, attempt);
    const method = order.transactions.payments[0].payment_method;
    return json({ qrCode: method.qr_code || '', qrCodeBase64: method.qr_code_base64 || '', expiresAt: attempt.expires_at, status: order.status });
  } catch (error) { return failure(error); }
}

export default request => withCors(request, handler);
