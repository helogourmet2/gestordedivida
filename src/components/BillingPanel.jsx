import { useEffect, useState } from 'react';
import { billingRequest } from '../lib/billing';
import { useBilling } from '../hooks/useBilling';
import { formatDate } from '../utils/formatters';

export default function BillingPanel() {
  const billing = useBilling();
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const status = billing?.status;
  const refresh = billing?.refresh;
  useEffect(() => {
    if (!payment || status?.lifetime) return;
    const timer = setInterval(() => refresh?.(), 15000);
    return () => clearInterval(timer);
  }, [payment, status?.lifetime, refresh]);
  async function checkout() {
    setBusy(true); setError('');
    try {
      const data = await billingRequest('billing-checkout', 'POST');
      setPayment(data);
      await refresh?.();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(payment.qrCode); setCopied(true); }
    catch { setError('Selecione e copie o código Pix no campo abaixo.'); }
  }
  return <section className="rounded-2xl p-4 space-y-3 bg-neutral-900 border border-neutral-800 text-white">
    <h3 className="font-bold text-base">Meu acesso · Período de teste</h3>
    {!billing?.enabled ? <p className="text-sm text-neutral-300">Você terá 3 meses gratuitos. Depois, acesso vitalício por R$ 10,00 em pagamento único via Pix. A ativação do período de teste será informada aqui.</p> : <>
      {status?.environment === 'test' && <p className="text-sm text-amber-400">Ambiente de teste: não efetue pagamentos reais.</p>}
      {status?.lifetime ? <p className="font-semibold text-green-400">Acesso vitalício liberado. Nenhuma mensalidade.</p> : status ? <>
        <p className="text-sm text-neutral-300">{status.allowed ? `Você está no período gratuito: ${status.daysRemaining} dia(s) restante(s), até ${formatDate(status.trialEndsAt)}.` : 'Seu período gratuito de 3 meses terminou.'}</p>
        <p className="text-sm text-neutral-300">Pagamento único de R$ 10,00 para acesso vitalício. Sem assinatura ou renovação automática.</p>
        <button onClick={checkout} disabled={busy} className="w-full rounded-xl py-3 px-4 bg-red-600 font-bold disabled:opacity-50">{busy ? 'Preparando Pix...' : payment ? 'Mostrar / atualizar meu Pix' : 'Liberar acesso vitalício por R$ 10,00'}</button>
      </> : <p className="text-sm text-neutral-300">{billing.loading ? 'Verificando seu acesso...' : 'Conecte-se à internet para verificar seu acesso.'}</p>}
      {payment && !status?.lifetime && <div className="space-y-3 pt-2">
        {payment.processing && <p className="text-sm">Seu Pix está sendo preparado. Toque em “Mostrar / atualizar meu Pix” em instantes.</p>}
        {payment.qrCodeBase64 && <img className="w-52 h-52 bg-white p-2 mx-auto rounded-lg" src={`data:image/png;base64,${payment.qrCodeBase64}`} alt="QR Code Pix para acesso vitalício de R$ 10,00" />}
        {payment.qrCode && <><label className="block text-sm">Pix copia e cola<textarea readOnly value={payment.qrCode} rows={3} className="mt-2 w-full rounded-xl p-3 bg-neutral-800 text-white border border-neutral-600 break-all" /></label><button onClick={copy} className="rounded-xl py-2 px-4 bg-neutral-700 font-semibold">{copied ? 'Código copiado' : 'Copiar código Pix'}</button><p className="text-xs text-neutral-400">Confira o recebedor no seu banco. O acesso é liberado após a confirmação do Mercado Pago.</p></>}
      </div>}
      {(error || billing.error) && <p role="alert" className="text-sm text-red-300">{error || billing.error}</p>}
      <button onClick={() => refresh?.()} disabled={billing.loading} className="text-sm underline text-neutral-300 disabled:opacity-50">{billing.loading ? 'Verificando...' : 'Atualizar status do acesso'}</button>
    </>}
  </section>;
}
