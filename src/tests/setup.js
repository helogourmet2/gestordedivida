import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do IndexedDB (Dexie não funciona em jsdom)
vi.mock('../db/database', () => ({
  db: {
    debts: { toArray: vi.fn(() => Promise.resolve([])), get: vi.fn(), add: vi.fn(), update: vi.fn(), delete: vi.fn(), orderBy: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })), filter: vi.fn(() => ({ sortBy: vi.fn(() => Promise.resolve([])) })) },
    debtCategories: { toArray: vi.fn(() => Promise.resolve([])), get: vi.fn(() => Promise.resolve(null)), orderBy: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })) },
    transactions: { toArray: vi.fn(() => Promise.resolve([])), orderBy: vi.fn(() => ({ reverse: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })) })) },
    transactionCategories: { toArray: vi.fn(() => Promise.resolve([])), orderBy: vi.fn(() => ({ toArray: vi.fn(() => Promise.resolve([])) })) },
  },
  addDebt: vi.fn(() => Promise.resolve(1)),
  updateDebt: vi.fn(() => Promise.resolve()),
  deleteDebt: vi.fn(() => Promise.resolve()),
  markAsPaid: vi.fn(() => Promise.resolve()),
  markAsUnpaid: vi.fn(() => Promise.resolve()),
  ensureDebtSyncMetadata: vi.fn(() => Promise.resolve([])),
  ensureTransactionSyncMetadata: vi.fn(() => Promise.resolve([])),
  ensureDebtCategorySyncMetadata: vi.fn(() => Promise.resolve([])),
  ensureTransactionCategorySyncMetadata: vi.fn(() => Promise.resolve([])),
  mergeRemoteDebts: vi.fn(() => Promise.resolve({ imported: 0, updated: 0, skipped: 0 })),
  mergeRemoteTransactions: vi.fn(() => Promise.resolve({ imported: 0, updated: 0, skipped: 0 })),
  mergeRemoteDebtCategories: vi.fn(() => Promise.resolve({ imported: 0, updated: 0, skipped: 0 })),
  mergeRemoteTransactionCategories: vi.fn(() => Promise.resolve({ imported: 0, updated: 0, skipped: 0 })),
  addDebtCategory: vi.fn(() => Promise.resolve(1)),
  updateDebtCategory: vi.fn(() => Promise.resolve()),
  deleteDebtCategory: vi.fn(() => Promise.resolve()),
}));

// Mock do Firebase
vi.mock('../lib/firebase', () => ({
  firebaseConfig: {},
  auth: { currentUser: null },
  onAuthStateChanged: vi.fn((auth, cb) => { cb(null); return () => {}; }),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
  requestFCMToken: vi.fn(() => Promise.resolve(null)),
  onForegroundMessage: vi.fn(() => () => {}),
  messaging: null,
}));

// Mock do Supabase
vi.mock('../lib/supabase', () => ({
  saveFCMToken: vi.fn(),
  syncDebt: vi.fn(),
  deleteDebtSync: vi.fn(),
  syncAllDebts: vi.fn(),
  syncTransaction: vi.fn(),
  deleteTransactionSync: vi.fn(),
  syncAllTransactions: vi.fn(),
  syncDebtCategory: vi.fn(),
  deleteDebtCategorySync: vi.fn(),
  syncAllDebtCategories: vi.fn(),
  syncTransactionCategory: vi.fn(),
  deleteTransactionCategorySync: vi.fn(),
  syncAllTransactionCategories: vi.fn(),
  fetchUserDebts: vi.fn(() => Promise.resolve([])),
  fetchUserTransactions: vi.fn(() => Promise.resolve([])),
  fetchUserDebtCategories: vi.fn(() => Promise.resolve([])),
  fetchUserTransactionCategories: vi.fn(() => Promise.resolve([])),
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
}));

// Mock do dexie-react-hooks
vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: vi.fn((fn) => {
    try { return undefined; } catch { return undefined; }
  }),
}));

// Mock de window.confirm
global.confirm = vi.fn(() => true);

// Suprimir warnings de console esperados nos testes
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Supabase') || args[0]?.includes?.('FCM')) return;
  originalWarn(...args);
};
