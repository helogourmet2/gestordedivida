import { useState, useCallback } from 'react';

const PIN_ENABLED_KEY = 'pin_enabled';
const PIN_HASH_KEY = 'pin_hash';

// Hash simples — o PIN é proteção de conveniência (não segurança crítica)
function hashPin(pin) {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = (hash << 5) - hash + pin.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export function usePin() {
  const [pinEnabled, setPinEnabled] = useState(() => localStorage.getItem(PIN_ENABLED_KEY) === 'true');
  // pinVerified: true após o usuário digitar o PIN correto nesta sessão
  const [pinVerified, setPinVerified] = useState(false);

  const verifyPin = useCallback((digits) => {
    const stored = localStorage.getItem(PIN_HASH_KEY);
    const correct = stored === hashPin(digits);
    if (correct) setPinVerified(true);
    return correct;
  }, []);

  const setPin = useCallback((digits) => {
    localStorage.setItem(PIN_HASH_KEY, hashPin(digits));
    localStorage.setItem(PIN_ENABLED_KEY, 'true');
    setPinEnabled(true);
    setPinVerified(true);
  }, []);

  const removePin = useCallback(() => {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.setItem(PIN_ENABLED_KEY, 'false');
    setPinEnabled(false);
    setPinVerified(false);
  }, []);

  const lockApp = useCallback(() => {
    setPinVerified(false);
  }, []);

  return { pinEnabled, pinVerified, verifyPin, setPin, removePin, lockApp };
}
