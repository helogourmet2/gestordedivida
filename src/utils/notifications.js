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

// Verificar e enviar notificações para dívidas próximas
export async function checkAndNotify() {
  if (Notification.permission !== 'granted') return;
  
  const lastCheck = localStorage.getItem('lastNotificationCheck');
  const today = new Date().toDateString();
  
  // Evitar notificações duplicadas no mesmo dia
  if (lastCheck === today) return;
  
  try {
    const debts = await db.debts
      .filter(d => !d.isPaid)
      .toArray();
    
    for (const debt of debts) {
      const days = daysUntilDue(debt.dueDate);
      
      if (days === 0) {
        sendNotification(
          '⚠️ Dívida vence hoje!',
          `${debt.name} - ${formatCurrency(debt.amount)} vence hoje!`
        );
      } else if (days === 1) {
        sendNotification(
          '📅 Dívida vence amanhã',
          `${debt.name} - ${formatCurrency(debt.amount)} vence amanhã.`
        );
      } else if (days < 0) {
        sendNotification(
          '🔴 Dívida vencida!',
          `${debt.name} - ${formatCurrency(debt.amount)} está vencida há ${Math.abs(days)} dia(s)!`
        );
      }
    }
    
    localStorage.setItem('lastNotificationCheck', today);
  } catch (error) {
    console.error('Erro ao verificar notificações:', error);
  }
}

// Enviar notificação local
function sendNotification(title, body) {
  try {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: title,
      renotify: false,
    });
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }
}

// Verificar se notificações estão habilitadas
export function isNotificationEnabled() {
  return 'Notification' in window && Notification.permission === 'granted';
}
