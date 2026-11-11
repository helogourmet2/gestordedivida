import { auth } from './firebase';
const billingApiUrl = (import.meta.env.VITE_BILLING_API_URL || '').replace(/\/+$/, '');
export const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === 'true';
export async function billingRequest(endpoint, method = 'GET') {
  if (!auth.currentUser) throw new Error('Entre na sua conta para continuar.');
  const token = await auth.currentUser.getIdToken();
  const response = await fetch(`${billingApiUrl}/.netlify/functions/${endpoint}`, {
    method, headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || 'Não foi possível verificar seu acesso. Confira a conexão e tente novamente.');
  return data;
}
