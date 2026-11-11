import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { accessStatus, paymentStatus, validPayment, verifyWebhook } from '../../netlify/lib/billing.mjs';
import { checkoutBody } from '../../netlify/functions/billing-checkout.mjs';

const attempt = { id: '5f1eb5c0-b520-4400-9a97-cd0184a87773', environment: 'production', mp_order_id: 'ORD123ABC' };
function order(overrides = {}) {
  return { id: 'ORD123ABC', external_reference: attempt.id, country_code: 'BRA', total_amount: '10.00', total_paid_amount: '10.00', status: 'processed', status_detail: 'accredited', live_mode: true,
    transactions: { payments: [{ amount: '10.00', paid_amount: '10.00', status: 'processed', status_detail: 'accredited', payment_method: { id: 'pix' } }] }, ...overrides };
}

describe('billing access', () => {
  const account = { trial_started_at: '2026-11-10T00:00:00Z', trial_ends_at: '2027-02-10T00:00:00Z' };
  it('allows the trial and expires exactly at the deadline', () => {
    expect(accessStatus(account, [], new Date('2027-02-09T23:59:59Z')).allowed).toBe(true);
    expect(accessStatus(account, [], new Date(account.trial_ends_at)).allowed).toBe(false);
    expect(accessStatus(account, [], new Date('2028-01-01')).daysRemaining).toBe(0);
  });
  it('allows a confirmed lifetime purchase after the trial', () => {
    expect(accessStatus(account, [{ id: 'paid' }], new Date('2030-01-01')).lifetime).toBe(true);
  });
  it('sets the amount and Pix method on the server', () => {
    const body = checkoutBody(attempt, { email: 'payer@example.com' });
    expect(body.total_amount).toBe('10.00');
    expect(body.external_reference).toBe(attempt.id);
    expect(body.transactions.payments[0].payment_method.id).toBe('pix');
  });
});

describe('billing order validation', () => {
  it('matches the purchase, currency, amount and payment method', () => {
    expect(validPayment(order(), attempt, 'production')).toBe(true);
    for (const changes of [{ external_reference: 'other-user' }, { total_amount: '1.00' }, { currency_id: 'ARS' }, { country_code: 'ARG' }, { id: 'ORDOTHER' }, { live_mode: false }]) {
      expect(validPayment(order(changes), attempt, 'production')).toBe(false);
    }
  });
  it('only approves confirmed, fully credited payments', () => {
    expect(paymentStatus(order())).toBe('approved');
    expect(paymentStatus(order({ status: 'action_required' }))).toBe('pending');
    expect(paymentStatus(order({ total_paid_amount: '0.00' }))).not.toBe('approved');
    expect(paymentStatus(order({ status: 'refunded' }))).toBe('refunded');
    expect(paymentStatus(order({ status_detail: 'partially_refunded' }))).not.toBe('approved');
  });
});

describe('Mercado Pago Orders webhook', () => {
  function request(id = 'ORD123ABC', signatureId = id.toLowerCase(), secret = 'secret') {
    const ts = '1794350000000';
    const hash = createHmac('sha256', secret).update(`id:${signatureId};request-id:request-1;ts:${ts};`).digest('hex');
    return new Request(`https://app.example/.netlify/functions/mercadopago-webhook?data.id=${id}&type=order`, { headers: { 'x-request-id': 'request-1', 'x-signature': `ts=${ts},v1=${hash}` } });
  }
  it('validates the signature with the lowercase alphanumeric order ID', () => {
    expect(verifyWebhook(request(), 'secret')).toBe(true);
    expect(verifyWebhook(request(), 'wrong-secret')).toBe(false);
    expect(verifyWebhook(request('ORDOTHER', 'ord123abc'), 'secret')).toBe(false);
  });
  it('rejects missing and malformed signatures', () => {
    expect(verifyWebhook(new Request('https://app.example/'), 'secret')).toBe(false);
  });
});
