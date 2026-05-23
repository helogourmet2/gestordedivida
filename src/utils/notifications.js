import { db } from '../db/database';
import { daysUntilDue, formatCurrency } from './formatters';

// Solicitar permissão para notificações
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Navegador não suporta notificações');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Enviar notificação — usa Service Worker no mobile, Notification API no desktop
export async function sendNotification(title, body, tag = 'debt-notification') {
  try {
    // Mobile (PWA): usa ServiceWorkerRegistration.showNotification
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag,
        renotify: true,
        vibrate: [200, 100, 200],
      });
      return;
    }
    // Desktop fallback
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag,
    });
  } catch (error) {
    console.error('[Notificação] Erro:', error);
  }
}

// Verificar e enviar notificações para dívidas próximas
export async function checkAndNotify() {
  if (Notification.permission !== 'granted') return;

  const lastCheck = localStorage.getItem('lastNotificationCheck');
  const today = new Date().toDateString();

  // Evitar notificações duplicadas no mesmo dia
  if (lastCheck === today) return;

  try {
    const debts = await db.debts.filter(d => !d.isPaid).toArray();

    for (const debt of debts) {
      const days = daysUntilDue(debt.dueDate);

      if (days === 0) {
        await sendNotification(
          '⚠️ Dívida vence hoje!',
          `${debt.name} — ${formatCurrency(debt.amount)} vence hoje!`,
          `today-${debt.id}`
        );
      } else if (days === 1) {
        await sendNotification(
          '📅 Dívida vence amanhã',
          `${debt.name} — ${formatCurrency(debt.amount)} vence amanhã.`,
          `tomorrow-${debt.id}`
        );
      } else if (days < 0) {
        await sendNotification(
          '🔴 Dívida vencida!',
          `${debt.name} — ${formatCurrency(debt.amount)} vencida há ${Math.abs(days)} dia(s)!`,
          `overdue-${debt.id}`
        );
      }
    }

    localStorage.setItem('lastNotificationCheck', today);
  } catch (error) {
    console.error('[Notificação] Erro ao verificar:', error);
  }
}

// Verificar se notificações estão habilitadas
export function isNotificationEnabled() {
  return 'Notification' in window && Notification.permission === 'granted';
}
