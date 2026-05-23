import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { saveFCMToken } from './supabase';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

// Inicializar Firebase (reutiliza instância se já existir)
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

// Inicializar Messaging (só funciona em contexto seguro HTTPS ou localhost)
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  console.warn('[FCM] Messaging não disponível neste contexto:', e.message);
}

// Solicitar permissão e obter token FCM
export async function requestFCMToken() {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (token) {
      console.log('[FCM] Token obtido:', token.substring(0, 20) + '...');
      // Salvar token no Supabase para push com app fechado
      await saveFCMToken(token);
      localStorage.setItem('fcm_token', token);
    }

    return token;
  } catch (err) {
    console.error('[FCM] Erro ao obter token:', err);
    return null;
  }
}

// Listener para mensagens com app aberto (foreground)
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}

export { messaging };
