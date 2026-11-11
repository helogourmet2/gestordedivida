import { useCallback, useEffect, useRef, useState } from 'react';
import { auth, onAuthStateChanged } from '../lib/firebase';
import { billingEnabled, billingRequest } from '../lib/billing';
import { BillingContext } from '../lib/billingContext';

export default function BillingProvider({ children }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(billingEnabled);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++sequence.current;
    const uid = auth.currentUser?.uid;
    if (!billingEnabled || !uid) { setLoading(false); return; }
    setLoading(true); setError('');
    try {
      const data = await billingRequest('billing-status');
      if (current === sequence.current && auth.currentUser?.uid === uid) setStatus(data);
    } catch (err) {
      if (current === sequence.current) setError(err.message);
    } finally { if (current === sequence.current) setLoading(false); }
  }, []);
  useEffect(() => {
    if (!billingEnabled) return;
    const unsubscribe = onAuthStateChanged(auth, () => { setStatus(null); refresh(); });
    const focus = () => refresh();
    window.addEventListener('focus', focus);
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60000);
    return () => { unsubscribe(); window.removeEventListener('focus', focus); clearInterval(timer); };
  }, [refresh]);
  return <BillingContext.Provider value={{ enabled: billingEnabled, status, loading, error, refresh }}>{children}</BillingContext.Provider>;
}
