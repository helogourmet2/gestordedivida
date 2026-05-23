// ─── Firebase / FCM ───────────────────────────────────────────────────────────
// Preencha com suas credenciais do Firebase após criar o projeto
// https://console.firebase.google.com → Configurações do projeto → Seus apps

// Cole aqui o objeto firebaseConfig do seu projeto Firebase
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

// VAPID Key pública para Web Push
// Firebase Console → Cloud Messaging → Configuração da Web → Certificados push da Web
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export function isFirebaseConfigured() {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    VAPID_KEY
  );
}
