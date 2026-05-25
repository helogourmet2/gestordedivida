import { localDateToISO } from '../utils/formatters';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export { SUPABASE_URL, SUPABASE_ANON_KEY };

function headers() {
  return {
    'Content-Type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  };
}

function isConfigured() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[Supabase] Credenciais nao configuradas.');
    return false;
  }
  return true;
}

function toRemoteDebt(debt, userId) {
  return {
    local_id: debt.id,
    sync_id: debt.syncId,
    user_id: userId,
    name: debt.name,
    amount: debt.amount,
    due_date: debt.dueDate ? debt.dueDate.split('T')[0] : null,
    category_sync_id: debt.categorySyncId ?? null,
    recurrence: debt.recurrence ?? null,
    installments: debt.installments ?? null,
    current_installment: debt.currentInstallment ?? null,
    parent_id: debt.parentId ?? null,
    is_paid: debt.isPaid ?? false,
    paid_at: debt.paidAt ?? null,
    created_at: debt.createdAt ?? new Date().toISOString(),
    updated_at: debt.updatedAt ?? new Date().toISOString(),
  };
}

function toLocalDebt(row) {
  return {
    syncId: row.sync_id ?? null,
    remoteLocalId: row.local_id ?? null,
    name: row.name,
    amount: Number(row.amount),
    dueDate: row.due_date ? localDateToISO(row.due_date) : null,
    categorySyncId: row.category_sync_id ?? null,
    recurrence: row.recurrence ?? 'unica',
    installments: row.installments ?? null,
    currentInstallment: row.current_installment ?? null,
    parentId: row.parent_id ?? null,
    isPaid: row.is_paid ?? false,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at ?? row.updated_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function toRemoteTransaction(transaction, userId) {
  return {
    local_id: transaction.id,
    sync_id: transaction.syncId,
    user_id: userId,
    type: transaction.type,
    amount: transaction.amount,
    transaction_date: transaction.date ? transaction.date.split('T')[0] : null,
    category_sync_id: transaction.categorySyncId ?? null,
    description: transaction.description ?? '',
    is_paid: transaction.isPaid ?? false,
    paid_at: transaction.paidAt ?? null,
    created_at: transaction.createdAt ?? new Date().toISOString(),
    updated_at: transaction.updatedAt ?? new Date().toISOString(),
  };
}

function toLocalTransaction(row) {
  return {
    syncId: row.sync_id ?? null,
    remoteLocalId: row.local_id ?? null,
    type: row.type ?? 'despesa',
    amount: Number(row.amount),
    date: row.transaction_date ? localDateToISO(row.transaction_date) : null,
    categorySyncId: row.category_sync_id ?? null,
    description: row.description ?? '',
    isPaid: row.is_paid ?? false,
    paidAt: row.paid_at ?? null,
    createdAt: row.created_at ?? row.updated_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function toRemoteDebtCategory(category, userId) {
  return {
    local_id: category.id,
    sync_id: category.syncId,
    user_id: userId,
    name: category.name,
    color: category.color ?? 'bg-neutral-500',
    is_default: category.isDefault ?? false,
    created_at: category.createdAt ?? new Date().toISOString(),
    updated_at: category.updatedAt ?? new Date().toISOString(),
  };
}

function toLocalDebtCategory(row) {
  return {
    syncId: row.sync_id ?? null,
    name: row.name,
    color: row.color ?? 'bg-neutral-500',
    isDefault: row.is_default ?? false,
    createdAt: row.created_at ?? row.updated_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

function toRemoteTransactionCategory(category, userId) {
  return {
    local_id: category.id,
    sync_id: category.syncId,
    user_id: userId,
    name: category.name,
    type: category.type ?? 'despesa',
    color: category.color ?? 'bg-neutral-500',
    icon: category.icon ?? 'Tag',
    is_default: category.isDefault ?? false,
    created_at: category.createdAt ?? new Date().toISOString(),
    updated_at: category.updatedAt ?? new Date().toISOString(),
  };
}

function toLocalTransactionCategory(row) {
  return {
    syncId: row.sync_id ?? null,
    name: row.name,
    type: row.type ?? 'despesa',
    color: row.color ?? 'bg-neutral-500',
    icon: row.icon ?? 'Tag',
    isDefault: row.is_default ?? false,
    createdAt: row.created_at ?? row.updated_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
  };
}

async function deleteBySyncId(table, syncId, userId) {
  if (!syncId || !userId) return;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?sync_id=eq.${encodeURIComponent(syncId)}&user_id=eq.${encodeURIComponent(userId)}`,
    { method: 'DELETE', headers: headers() }
  );
  if (!res.ok) throw new Error(await res.text());
}

export async function saveFCMToken(token, userId) {
  if (!isConfigured()) return;
  const uid = userId ?? 'anonymous';

  try {
    const resPatch = await fetch(
      `${SUPABASE_URL}/rest/v1/fcm_tokens?token=eq.${encodeURIComponent(token)}`,
      {
        method: 'PATCH',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify({ user_id: uid, updated_at: new Date().toISOString() }),
      }
    );

    if (resPatch.status === 404 || resPatch.headers.get('content-range') === '*/0') {
      const resInsert = await fetch(`${SUPABASE_URL}/rest/v1/fcm_tokens`, {
        method: 'POST',
        headers: { ...headers(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          user_id: uid,
          token,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!resInsert.ok) throw new Error(await resInsert.text());
    }

    console.log('[Supabase] Token FCM salvo:', uid);
  } catch (err) {
    console.error('[Supabase] Erro ao salvar token FCM:', err);
  }
}

export async function syncDebt(debt, userId) {
  if (!isConfigured() || !userId || debt.id == null || !debt.syncId) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debts?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(toRemoteDebt(debt, userId)),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status !== 409) throw new Error(txt);
    }
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar divida:', err);
  }
}

export async function deleteDebtSync(debt, userId) {
  if (!isConfigured() || !userId || !debt) return;

  try {
    await deleteBySyncId('debts', debt.syncId, userId);
  } catch (err) {
    console.error('[Supabase] Erro ao deletar divida:', err);
  }
}

export async function syncAllDebts(debts, userId) {
  if (!isConfigured() || !userId || !debts.length) return;

  const rows = debts
    .filter(debt => debt.id != null && debt.syncId)
    .map(debt => toRemoteDebt(debt, userId));

  if (rows.length === 0) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debts?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`[Supabase] ${rows.length} dividas sincronizadas`);
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar dividas em lote:', err);
  }
}

export async function fetchUserDebts(userId) {
  if (!isConfigured() || !userId) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/debts?user_id=eq.${encodeURIComponent(userId)}&select=local_id,sync_id,name,amount,due_date,category_sync_id,recurrence,installments,current_installment,parent_id,is_paid,paid_at,created_at,updated_at&order=due_date.asc`,
      { method: 'GET', headers: headers() }
    );

    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(toLocalDebt) : [];
  } catch (err) {
    console.error('[Supabase] Erro ao buscar dividas do usuario:', err);
    return [];
  }
}

export async function syncTransaction(transaction, userId) {
  if (!isConfigured() || !userId || transaction.id == null || !transaction.syncId) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(toRemoteTransaction(transaction, userId)),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status !== 409) throw new Error(txt);
    }
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar transacao:', err);
  }
}

export async function deleteTransactionSync(transaction, userId) {
  if (!isConfigured() || !userId || !transaction) return;

  try {
    await deleteBySyncId('transactions', transaction.syncId, userId);
  } catch (err) {
    console.error('[Supabase] Erro ao deletar transacao:', err);
  }
}

export async function syncAllTransactions(transactions, userId) {
  if (!isConfigured() || !userId || !transactions.length) return;

  const rows = transactions
    .filter(transaction => transaction.id != null && transaction.syncId)
    .map(transaction => toRemoteTransaction(transaction, userId));

  if (rows.length === 0) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(await res.text());
    console.log(`[Supabase] ${rows.length} transacoes sincronizadas`);
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar transacoes em lote:', err);
  }
}

export async function fetchUserTransactions(userId) {
  if (!isConfigured() || !userId) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${encodeURIComponent(userId)}&select=local_id,sync_id,type,amount,transaction_date,category_sync_id,description,is_paid,paid_at,created_at,updated_at&order=transaction_date.desc`,
      { method: 'GET', headers: headers() }
    );

    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(toLocalTransaction) : [];
  } catch (err) {
    console.error('[Supabase] Erro ao buscar transacoes do usuario:', err);
    return [];
  }
}

export async function syncDebtCategory(category, userId) {
  if (!isConfigured() || !userId || category.id == null || !category.syncId) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debt_categories?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(toRemoteDebtCategory(category, userId)),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status !== 409) throw new Error(txt);
    }
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar categoria de divida:', err);
  }
}

export async function deleteDebtCategorySync(category, userId) {
  if (!isConfigured() || !userId || !category) return;

  try {
    await deleteBySyncId('debt_categories', category.syncId, userId);
  } catch (err) {
    console.error('[Supabase] Erro ao deletar categoria de divida:', err);
  }
}

export async function syncAllDebtCategories(categories, userId) {
  if (!isConfigured() || !userId || !categories.length) return;

  const rows = categories
    .filter(category => category.id != null && category.syncId)
    .map(category => toRemoteDebtCategory(category, userId));

  if (rows.length === 0) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/debt_categories?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar categorias de divida:', err);
  }
}

export async function fetchUserDebtCategories(userId) {
  if (!isConfigured() || !userId) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/debt_categories?user_id=eq.${encodeURIComponent(userId)}&select=sync_id,name,color,is_default,created_at,updated_at&order=name.asc`,
      { method: 'GET', headers: headers() }
    );

    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(toLocalDebtCategory) : [];
  } catch (err) {
    console.error('[Supabase] Erro ao buscar categorias de divida:', err);
    return [];
  }
}

export async function syncTransactionCategory(category, userId) {
  if (!isConfigured() || !userId || category.id == null || !category.syncId) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transaction_categories?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: {
        ...headers(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(toRemoteTransactionCategory(category, userId)),
    });

    if (!res.ok) {
      const txt = await res.text();
      if (res.status !== 409) throw new Error(txt);
    }
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar categoria de transacao:', err);
  }
}

export async function deleteTransactionCategorySync(category, userId) {
  if (!isConfigured() || !userId || !category) return;

  try {
    await deleteBySyncId('transaction_categories', category.syncId, userId);
  } catch (err) {
    console.error('[Supabase] Erro ao deletar categoria de transacao:', err);
  }
}

export async function syncAllTransactionCategories(categories, userId) {
  if (!isConfigured() || !userId || !categories.length) return;

  const rows = categories
    .filter(category => category.id != null && category.syncId)
    .map(category => toRemoteTransactionCategory(category, userId));

  if (rows.length === 0) return;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/transaction_categories?on_conflict=user_id,sync_id`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) throw new Error(await res.text());
  } catch (err) {
    console.error('[Supabase] Erro ao sincronizar categorias de transacao:', err);
  }
}

export async function fetchUserTransactionCategories(userId) {
  if (!isConfigured() || !userId) return [];

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/transaction_categories?user_id=eq.${encodeURIComponent(userId)}&select=sync_id,name,type,color,icon,is_default,created_at,updated_at&order=name.asc`,
      { method: 'GET', headers: headers() }
    );

    if (!res.ok) throw new Error(await res.text());
    const rows = await res.json();
    return Array.isArray(rows) ? rows.map(toLocalTransactionCategory) : [];
  } catch (err) {
    console.error('[Supabase] Erro ao buscar categorias de transacao:', err);
    return [];
  }
}
