import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signInWithGoogle, signOut } from '../lib/firebase';
import {
  fetchUserDebtCategories,
  fetchUserDebts,
  fetchUserTransactionCategories,
  fetchUserTransactions,
  syncAllDebtCategories,
  syncAllDebts,
  syncAllTransactionCategories,
  syncAllTransactions,
} from '../lib/supabase';
import {
  ensureDebtCategorySyncMetadata,
  ensureDebtSyncMetadata,
  ensureTransactionCategorySyncMetadata,
  ensureTransactionSyncMetadata,
  mergeRemoteDebtCategories,
  mergeRemoteDebts,
  mergeRemoteTransactionCategories,
  mergeRemoteTransactions,
} from '../db/database';

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
          const { requestFCMToken } = await import('../lib/firebase');
          await requestFCMToken();
        } catch (e) {
          console.warn('[Auth] Erro ao registrar token FCM:', e);
        }

        try {
          const localDebtCategories = await ensureDebtCategorySyncMetadata();
          const localTransactionCategories = await ensureTransactionCategorySyncMetadata();

          if (localDebtCategories.length > 0) {
            await syncAllDebtCategories(localDebtCategories, firebaseUser.uid);
          }
          if (localTransactionCategories.length > 0) {
            await syncAllTransactionCategories(localTransactionCategories, firebaseUser.uid);
          }

          const remoteDebtCategories = await fetchUserDebtCategories(firebaseUser.uid);
          if (remoteDebtCategories.length > 0) {
            await mergeRemoteDebtCategories(remoteDebtCategories);
          }

          const remoteTransactionCategories = await fetchUserTransactionCategories(firebaseUser.uid);
          if (remoteTransactionCategories.length > 0) {
            await mergeRemoteTransactionCategories(remoteTransactionCategories);
          }

          const localDebts = await ensureDebtSyncMetadata();
          const localTransactions = await ensureTransactionSyncMetadata();

          if (localDebts.length > 0) {
            await syncAllDebts(localDebts, firebaseUser.uid);
          }
          if (localTransactions.length > 0) {
            await syncAllTransactions(localTransactions, firebaseUser.uid);
          }

          const remoteDebts = await fetchUserDebts(firebaseUser.uid);
          if (remoteDebts.length > 0) {
            await mergeRemoteDebts(remoteDebts);
          }

          const remoteTransactions = await fetchUserTransactions(firebaseUser.uid);
          if (remoteTransactions.length > 0) {
            await mergeRemoteTransactions(remoteTransactions);
          }
        } catch (e) {
          console.warn('[Auth] Erro ao sincronizar dados no login:', e);
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
