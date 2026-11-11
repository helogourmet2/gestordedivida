import { authenticate, requireMethod, startTrial, database, mercadoPago, recordPayment, accessStatus, environment, json, failure } from '../lib/billing.mjs';

export default async function handler(request) {
  try {
    requireMethod(request, 'GET');
    const user = await authenticate(request);
    const account = await startTrial(user.uid);
    const mode = environment();
    const filter = `user_id=eq.${encodeURIComponent(user.uid)}&environment=eq.${mode}`;
    const pending = await database(`billing_payments?${filter}&status=in.(pending,in_process)&order=created_at.desc&limit=1`);
    // Consulta o recurso verdadeiro; o navegador nunca informa que um Pix foi pago.
    for (const attempt of pending) {
      if (attempt.mp_order_id) await recordPayment(await mercadoPago(`/v1/orders/${encodeURIComponent(attempt.mp_order_id)}`), attempt);
    }
    const paid = await database(`billing_payments?${filter}&status=eq.approved&select=id&limit=1`);
    return json({ ...accessStatus(account, paid), environment: mode });
  } catch (error) { return failure(error); }
}
