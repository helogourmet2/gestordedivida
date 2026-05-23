import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, signOut } from '../lib/firebase';
import { syncAllDebts } from '../lib/supabase';
import { db } from '../db/database';

export function useAuth() {
  const [user, setUser] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        try {
          // Registrar token FCM automaticamente ao logar
          const { requestFCMToken } = await import('../lib/firebase');
          await requestFCMToken();
        } catch (e) {
          console.warn('[Auth] Erro ao registrar token FCM:', e);
        }

        // Sincronizar dívidas existentes com o Supabase
        try {
          const debts = await db.debts.toArray();
          if (debts.length > 0) {
            syncAllDebts(debts, firebaseUser.uid).catch(() => {});
          }
        } catch (e) {
          console.warn('[Auth] Erro ao sincronizar dívidas no login:', e);
        }
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError('Erro ao entrar com Google. Tente novamente.');
        console.error('[Auth]', err);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[Auth] Erro ao sair:', err);
    }
  };

  return { user, loading, login, logout, error };
}
