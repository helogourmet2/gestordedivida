import { beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import BillingPanel from '../components/BillingPanel';
import { BillingContext } from '../lib/billingContext';
import { billingRequest } from '../lib/billing';
vi.mock('../lib/billing', () => ({ billingRequest: vi.fn() }));
beforeEach(() => { cleanup(); vi.clearAllMocks(); });
function show(status, enabled = true) {
  const refresh = vi.fn();
  render(<BillingContext.Provider value={{ enabled, status, refresh, loading: false, error: '' }}><BillingPanel /></BillingContext.Provider>);
  return refresh;
}
it('shows the trial deadline and one-time price in Config', () => {
  show({ allowed: true, lifetime: false, daysRemaining: 30, trialEndsAt: '2027-02-10T12:00:00Z' });
  expect(screen.getByText(/30 dia/)).toHaveTextContent('10/02/2027');
  expect(screen.getByRole('button', { name: 'Liberar acesso vitalício por R$ 10,00' })).toBeInTheDocument();
});
it('shows the returned Pix code without claiming payment approval', async () => {
  billingRequest.mockResolvedValue({ qrCode: 'COPIA-E-COLA' });
  const refresh = show({ allowed: false, lifetime: false });
  fireEvent.click(screen.getByRole('button', { name: 'Liberar acesso vitalício por R$ 10,00' }));
  await waitFor(() => expect(screen.getByDisplayValue('COPIA-E-COLA')).toBeInTheDocument());
  expect(refresh).toHaveBeenCalled();
  expect(screen.queryByText(/Acesso vitalício liberado/)).toBeNull();
});
it('removes the buy button after lifetime confirmation', () => {
  show({ lifetime: true, allowed: true });
  expect(screen.getByText(/Acesso vitalício liberado/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Liberar acesso/ })).toBeNull();
});
it('keeps payment unavailable until configuration is activated', () => {
  show(null, false);
  expect(screen.getByText(/3 meses gratuitos/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /Liberar acesso/ })).toBeNull();
});
