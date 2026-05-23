import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, checkAndNotify, isNotificationEnabled } from '../utils/notifications';

export function useNotifications() {
  const [enabled, setEnabled] = useState(isNotificationEnabled());

  useEffect(() => {
    // Verificar notificações ao carregar
    if (enabled) {
      checkAndNotify();
    }
  }, [enabled]);

  const requestPermission = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setEnabled(granted);
    if (granted) {
      checkAndNotify();
    }
    return granted;
  }, []);

  const recheckNotifications = useCallback(() => {
    if (enabled) {
      // Limpar o cache para forçar nova verificação
      localStorage.removeItem('lastNotificationCheck');
      checkAndNotify();
    }
  }, [enabled]);

  return {
    notificationsEnabled: enabled,
    requestPermission,
    recheckNotifications,
  };
}
