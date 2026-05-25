import Dexie from 'dexie';
import {
  syncDebt,
  deleteDebtSync,
  syncTransaction,
  deleteTransactionSync,
  syncDebtCategory,
  deleteDebtCategorySync,
  syncTransactionCategory,
  deleteTransactionCategorySync,
} from '../lib/supabase';
import { auth } from '../lib/firebase';
import { localDateToISO } from '../utils/formatters';

function getCurrentUserId() {
  return auth?.currentUser?.uid ?? null;
}

function createSyncId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  const suffix = Math.random().toString(16).slice(2, 10);
  return `sync-${Date.now()}-${suffix}`;
}

function toComparableTime(value) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function slugifySyncPart(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildNormalizedDebt(debt, nowIso) {
  return {
    ...debt,
    syncId: debt.syncId || createSyncId(),
    updatedAt: debt.updatedAt || debt.createdAt || nowIso,
    createdAt: debt.createdAt || nowIso,
  };
}

function buildNormalizedTransaction(transaction, nowIso) {
  return {
    ...transaction,
    syncId: transaction.syncId || createSyncId(),
    updatedAt: transaction.updatedAt || transaction.createdAt || nowIso,
    createdAt: transaction.createdAt || nowIso,
  };
}

function getDebtCategorySyncId(category) {
  if (category.syncId) return category.syncId;
  if (category.isDefault) {
    return `default-debt-category-${slugifySyncPart(category.name)}`;
  }
  return createSyncId();
}

function getTransactionCategorySyncId(category) {
  if (category.syncId) return category.syncId;
  if (category.isDefault) {
    return `default-transaction-category-${slugifySyncPart(category.type)}-${slugifySyncPart(category.name)}`;
  }
  return createSyncId();
}

function buildNormalizedDebtCategory(category, nowIso) {
  return {
    ...category,
    syncId: getDebtCategorySyncId(category),
    updatedAt: category.updatedAt || nowIso,
    createdAt: category.createdAt || nowIso,
  };
}

function buildNormalizedTransactionCategory(category, nowIso) {
  return {
    ...category,
    syncId: getTransactionCategorySyncId(category),
    updatedAt: category.updatedAt || nowIso,
    createdAt: category.createdAt || nowIso,
  };
}

export const db = new Dexie('GestorDeDividas');

db.version(1).stores({
  debts: '++id, name, amount, dueDate, category, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key'
});

db.version(2).stores({
  debts: '++id, name, amount, dueDate, category, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key',
  transactions: '++id, type, amount, date, categoryId, description, isPaid, paidAt, createdAt',
  transactionCategories: '++id, name, type, color, icon, isDefault',
}).upgrade(async tx => {
  // Seed das categorias padrao de transacoes
  await tx.table('transactionCategories').bulkAdd([
    { name: 'Salário',          type: 'receita', color: 'bg-green-600',   icon: 'Banknote',       isDefault: true },
    { name: 'Aluguel recebido', type: 'receita', color: 'bg-emerald-500', icon: 'Home',           isDefault: true },
    { name: 'Saque cassino',    type: 'receita', color: 'bg-yellow-500',  icon: 'TrendingUp',     isDefault: true },
    { name: 'Extra',            type: 'receita', color: 'bg-blue-500',    icon: 'Plus',           isDefault: true },
    { name: 'Pagamento',        type: 'despesa', color: 'bg-red-600',     icon: 'CreditCard',     isDefault: true },
    { name: 'Aluguel',          type: 'despesa', color: 'bg-orange-500',  icon: 'Home',           isDefault: true },
    { name: 'Depósito cassino', type: 'despesa', color: 'bg-purple-500',  icon: 'TrendingDown',   isDefault: true },
    { name: 'Extra',            type: 'despesa', color: 'bg-neutral-500', icon: 'MoreHorizontal', isDefault: true },
  ]);
});

db.version(3).stores({
  debts: '++id, name, amount, dueDate, categoryId, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key',
  transactions: '++id, type, amount, date, categoryId, description, isPaid, paidAt, createdAt',
  transactionCategories: '++id, name, type, color, icon, isDefault',
  debtCategories: '++id, name, color, isDefault',
}).upgrade(async tx => {
  // Seed das categorias padrao de dividas
  const catIds = await tx.table('debtCategories').bulkAdd([
    { name: 'Essencial', color: 'bg-red-600',     isDefault: true },
    { name: 'Cartão',    color: 'bg-orange-500',  isDefault: true },
    { name: 'Lazer',     color: 'bg-purple-500',  isDefault: true },
    { name: 'Outros',    color: 'bg-neutral-500', isDefault: true },
  ], { allKeys: true });

  // Migrar dividas existentes: converter category string -> categoryId numerico
  const nameToId = { essencial: catIds[0], cartao: catIds[1], lazer: catIds[2], outros: catIds[3] };
  const allDebts = await tx.table('debts').toArray();
  for (const debt of allDebts) {
    const newCatId = nameToId[debt.category] ?? catIds[3];
    await tx.table('debts').update(debt.id, { categoryId: newCatId });
  }
});

db.version(4).stores({
  debts: '++id, syncId, updatedAt, name, amount, dueDate, categoryId, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key',
  transactions: '++id, type, amount, date, categoryId, description, isPaid, paidAt, createdAt',
  transactionCategories: '++id, name, type, color, icon, isDefault',
  debtCategories: '++id, name, color, isDefault',
}).upgrade(async tx => {
  const debts = await tx.table('debts').toArray();
  const nowIso = new Date().toISOString();

  for (const debt of debts) {
    const normalized = buildNormalizedDebt(debt, nowIso);
    const changes = {};
    if (normalized.syncId !== debt.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== debt.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== debt.createdAt) changes.createdAt = normalized.createdAt;

    if (Object.keys(changes).length > 0) {
      await tx.table('debts').update(debt.id, changes);
    }
  }
});

db.version(5).stores({
  debts: '++id, syncId, updatedAt, name, amount, dueDate, categoryId, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key',
  transactions: '++id, syncId, updatedAt, type, amount, date, categoryId, description, isPaid, paidAt, createdAt',
  transactionCategories: '++id, syncId, updatedAt, name, type, color, icon, isDefault',
  debtCategories: '++id, syncId, updatedAt, name, color, isDefault',
}).upgrade(async tx => {
  const nowIso = new Date().toISOString();
  const debtCategories = await tx.table('debtCategories').toArray();
  const transactionCategories = await tx.table('transactionCategories').toArray();
  const transactions = await tx.table('transactions').toArray();

  for (const category of debtCategories) {
    const normalized = buildNormalizedDebtCategory(category, nowIso);
    const changes = {};
    if (normalized.syncId !== category.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== category.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== category.createdAt) changes.createdAt = normalized.createdAt;
    if (Object.keys(changes).length > 0) {
      await tx.table('debtCategories').update(category.id, changes);
    }
  }

  for (const category of transactionCategories) {
    const normalized = buildNormalizedTransactionCategory(category, nowIso);
    const changes = {};
    if (normalized.syncId !== category.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== category.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== category.createdAt) changes.createdAt = normalized.createdAt;
    if (Object.keys(changes).length > 0) {
      await tx.table('transactionCategories').update(category.id, changes);
    }
  }

  for (const transaction of transactions) {
    const normalized = buildNormalizedTransaction(transaction, nowIso);
    const changes = {};
    if (normalized.syncId !== transaction.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== transaction.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== transaction.createdAt) changes.createdAt = normalized.createdAt;
    if (Object.keys(changes).length > 0) {
      await tx.table('transactions').update(transaction.id, changes);
    }
  }
});

export async function ensureDebtSyncMetadata() {
  const debts = await db.debts.toArray();
  const nowIso = new Date().toISOString();

  for (const debt of debts) {
    const normalized = buildNormalizedDebt(debt, nowIso);
    const changes = {};
    if (normalized.syncId !== debt.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== debt.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== debt.createdAt) changes.createdAt = normalized.createdAt;

    if (Object.keys(changes).length > 0) {
      await db.debts.update(debt.id, changes);
      Object.assign(debt, changes);
    }
  }

  return debts;
}

export async function ensureTransactionSyncMetadata() {
  const transactions = await db.transactions.toArray();
  const nowIso = new Date().toISOString();

  for (const transaction of transactions) {
    const normalized = buildNormalizedTransaction(transaction, nowIso);
    const changes = {};
    if (normalized.syncId !== transaction.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== transaction.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== transaction.createdAt) changes.createdAt = normalized.createdAt;

    if (Object.keys(changes).length > 0) {
      await db.transactions.update(transaction.id, changes);
      Object.assign(transaction, changes);
    }
  }

  return transactions;
}

export async function ensureDebtCategorySyncMetadata() {
  const categories = await db.debtCategories.toArray();
  const nowIso = new Date().toISOString();

  for (const category of categories) {
    const normalized = buildNormalizedDebtCategory(category, nowIso);
    const changes = {};
    if (normalized.syncId !== category.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== category.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== category.createdAt) changes.createdAt = normalized.createdAt;

    if (Object.keys(changes).length > 0) {
      await db.debtCategories.update(category.id, changes);
      Object.assign(category, changes);
    }
  }

  return categories;
}

export async function ensureTransactionCategorySyncMetadata() {
  const categories = await db.transactionCategories.toArray();
  const nowIso = new Date().toISOString();

  for (const category of categories) {
    const normalized = buildNormalizedTransactionCategory(category, nowIso);
    const changes = {};
    if (normalized.syncId !== category.syncId) changes.syncId = normalized.syncId;
    if (normalized.updatedAt !== category.updatedAt) changes.updatedAt = normalized.updatedAt;
    if (normalized.createdAt !== category.createdAt) changes.createdAt = normalized.createdAt;

    if (Object.keys(changes).length > 0) {
      await db.transactionCategories.update(category.id, changes);
      Object.assign(category, changes);
    }
  }

  return categories;
}

async function getDebtCategorySyncIdByLocalId(categoryId) {
  if (categoryId == null) return null;
  const category = await db.debtCategories.get(categoryId);
  return category?.syncId || null;
}

async function getTransactionCategorySyncIdByLocalId(categoryId) {
  if (categoryId == null) return null;
  const category = await db.transactionCategories.get(categoryId);
  return category?.syncId || null;
}

async function getDebtSyncPayload(debt) {
  return {
    ...debt,
    categorySyncId: await getDebtCategorySyncIdByLocalId(debt.categoryId),
  };
}

async function getTransactionSyncPayload(transaction) {
  return {
    ...transaction,
    categorySyncId: await getTransactionCategorySyncIdByLocalId(transaction.categoryId),
  };
}

export async function mergeRemoteDebtCategories(remoteCategories = []) {
  if (!Array.isArray(remoteCategories) || remoteCategories.length === 0) {
    return { imported: 0, updated: 0, skipped: 0 };
  }

  const localCategories = await ensureDebtCategorySyncMetadata();
  const bySyncId = new Map(localCategories.filter(category => category.syncId).map(category => [category.syncId, category]));
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const remoteCategory of remoteCategories) {
    const localCategory = remoteCategory.syncId ? bySyncId.get(remoteCategory.syncId) : null;
    const payload = {
      syncId: remoteCategory.syncId || createSyncId(),
      name: remoteCategory.name,
      color: remoteCategory.color ?? 'bg-neutral-500',
      isDefault: remoteCategory.isDefault ?? false,
      createdAt: remoteCategory.createdAt || remoteCategory.updatedAt || new Date().toISOString(),
      updatedAt: remoteCategory.updatedAt || remoteCategory.createdAt || new Date().toISOString(),
    };

    if (!localCategory) {
      await db.debtCategories.add(payload);
      imported += 1;
      continue;
    }

    if (toComparableTime(payload.updatedAt) > toComparableTime(localCategory.updatedAt || localCategory.createdAt)) {
      await db.debtCategories.update(localCategory.id, payload);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  return { imported, updated, skipped };
}

export async function mergeRemoteTransactionCategories(remoteCategories = []) {
  if (!Array.isArray(remoteCategories) || remoteCategories.length === 0) {
    return { imported: 0, updated: 0, skipped: 0 };
  }

  const localCategories = await ensureTransactionCategorySyncMetadata();
  const bySyncId = new Map(localCategories.filter(category => category.syncId).map(category => [category.syncId, category]));
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const remoteCategory of remoteCategories) {
    const localCategory = remoteCategory.syncId ? bySyncId.get(remoteCategory.syncId) : null;
    const payload = {
      syncId: remoteCategory.syncId || createSyncId(),
      name: remoteCategory.name,
      type: remoteCategory.type ?? 'despesa',
      color: remoteCategory.color ?? 'bg-neutral-500',
      icon: remoteCategory.icon ?? 'Tag',
      isDefault: remoteCategory.isDefault ?? false,
      createdAt: remoteCategory.createdAt || remoteCategory.updatedAt || new Date().toISOString(),
      updatedAt: remoteCategory.updatedAt || remoteCategory.createdAt || new Date().toISOString(),
    };

    if (!localCategory) {
      await db.transactionCategories.add(payload);
      imported += 1;
      continue;
    }

    if (toComparableTime(payload.updatedAt) > toComparableTime(localCategory.updatedAt || localCategory.createdAt)) {
      await db.transactionCategories.update(localCategory.id, payload);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  return { imported, updated, skipped };
}

export async function mergeRemoteDebts(remoteDebts = []) {
  if (!Array.isArray(remoteDebts) || remoteDebts.length === 0) {
    return { imported: 0, updated: 0, skipped: 0 };
  }

  const localDebts = await ensureDebtSyncMetadata();
  const localBySyncId = new Map(localDebts.filter(debt => debt.syncId).map(debt => [debt.syncId, debt]));
  const localByLegacyId = new Map(localDebts.filter(debt => debt.id != null).map(debt => [String(debt.id), debt]));
  const localCategories = await ensureDebtCategorySyncMetadata();
  const categoryIdBySyncId = new Map(localCategories.filter(category => category.syncId).map(category => [category.syncId, category.id]));

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const remoteDebt of remoteDebts) {
    const localDebt = (remoteDebt.syncId && localBySyncId.get(remoteDebt.syncId))
      || (remoteDebt.remoteLocalId != null && localByLegacyId.get(String(remoteDebt.remoteLocalId)));
    const payload = {
      syncId: remoteDebt.syncId || createSyncId(),
      name: remoteDebt.name,
      amount: parseFloat(remoteDebt.amount),
      dueDate: remoteDebt.dueDate,
      categoryId: remoteDebt.categorySyncId
        ? (categoryIdBySyncId.get(remoteDebt.categorySyncId) ?? null)
        : (remoteDebt.categoryId ?? null),
      recurrence: remoteDebt.recurrence ?? 'unica',
      installments: remoteDebt.installments ?? null,
      currentInstallment: remoteDebt.currentInstallment ?? null,
      isPaid: remoteDebt.isPaid ?? false,
      paidAt: remoteDebt.paidAt ?? null,
      createdAt: remoteDebt.createdAt || remoteDebt.updatedAt || new Date().toISOString(),
      updatedAt: remoteDebt.updatedAt || remoteDebt.createdAt || new Date().toISOString(),
      parentId: remoteDebt.parentId ?? null,
    };

    if (!localDebt) {
      await db.debts.add(payload);
      imported += 1;
      continue;
    }

    const remoteTimestamp = toComparableTime(payload.updatedAt);
    const localTimestamp = toComparableTime(localDebt.updatedAt || localDebt.createdAt);
    const needsSyncIdRepair = !localDebt.syncId && !!payload.syncId;

    if (remoteTimestamp > localTimestamp || needsSyncIdRepair) {
      await db.debts.update(localDebt.id, payload);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  return { imported, updated, skipped };
}

export async function mergeRemoteTransactions(remoteTransactions = []) {
  if (!Array.isArray(remoteTransactions) || remoteTransactions.length === 0) {
    return { imported: 0, updated: 0, skipped: 0 };
  }

  const localTransactions = await ensureTransactionSyncMetadata();
  const localBySyncId = new Map(localTransactions.filter(transaction => transaction.syncId).map(transaction => [transaction.syncId, transaction]));
  const localByLegacyId = new Map(localTransactions.filter(transaction => transaction.id != null).map(transaction => [String(transaction.id), transaction]));
  const localCategories = await ensureTransactionCategorySyncMetadata();
  const categoryIdBySyncId = new Map(localCategories.filter(category => category.syncId).map(category => [category.syncId, category.id]));

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const remoteTransaction of remoteTransactions) {
    const localTransaction = (remoteTransaction.syncId && localBySyncId.get(remoteTransaction.syncId))
      || (remoteTransaction.remoteLocalId != null && localByLegacyId.get(String(remoteTransaction.remoteLocalId)));
    const payload = {
      syncId: remoteTransaction.syncId || createSyncId(),
      type: remoteTransaction.type ?? 'despesa',
      amount: parseFloat(remoteTransaction.amount),
      date: remoteTransaction.date,
      categoryId: remoteTransaction.categorySyncId
        ? (categoryIdBySyncId.get(remoteTransaction.categorySyncId) ?? null)
        : (remoteTransaction.categoryId ?? null),
      description: remoteTransaction.description ?? '',
      isPaid: remoteTransaction.isPaid ?? false,
      paidAt: remoteTransaction.paidAt ?? null,
      createdAt: remoteTransaction.createdAt || remoteTransaction.updatedAt || new Date().toISOString(),
      updatedAt: remoteTransaction.updatedAt || remoteTransaction.createdAt || new Date().toISOString(),
    };

    if (!localTransaction) {
      await db.transactions.add(payload);
      imported += 1;
      continue;
    }

    if (toComparableTime(payload.updatedAt) > toComparableTime(localTransaction.updatedAt || localTransaction.createdAt)) {
      await db.transactions.update(localTransaction.id, payload);
      updated += 1;
      continue;
    }

    skipped += 1;
  }

  return { imported, updated, skipped };
}

// Adicionar nova dívida
export async function addDebt(debt) {
  const nowIso = new Date().toISOString();
  const uid = getCurrentUserId();
  const baseDebt = buildNormalizedDebt({
    ...debt,
    amount: parseFloat(debt.amount),
    isPaid: false,
    paidAt: null,
    createdAt: nowIso,
    parentId: null,
  }, nowIso);

  if (debt.recurrence === 'parcelada' && debt.installments > 1) {
    const ids = [];
    const totalInstallments = parseInt(debt.installments);
    const installmentAmount = parseFloat((baseDebt.amount / totalInstallments).toFixed(2));

    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(debt.dueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const newDebt = {
        ...baseDebt,
        syncId: createSyncId(),
        name: `${debt.name} (${i + 1}/${totalInstallments})`,
        amount: installmentAmount,
        dueDate: localDateToISO(`${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${String(dueDate.getDate()).padStart(2, '0')}`),
        currentInstallment: i + 1,
        installments: totalInstallments,
        parentId: i === 0 ? null : 'batch',
        updatedAt: nowIso,
      };
      const id = await db.debts.add(newDebt);
      ids.push(id);
      getDebtSyncPayload({ ...newDebt, id })
        .then(payload => syncDebt(payload, uid).catch(() => {}))
        .catch(() => {});
    }
    return ids;
  }

  const newDebt = {
    ...baseDebt,
    dueDate: localDateToISO(debt.dueDate),
    installments: debt.recurrence === 'parcelada' ? 1 : null,
    currentInstallment: debt.recurrence === 'parcelada' ? 1 : null,
    updatedAt: nowIso,
  };
  const id = await db.debts.add(newDebt);
  getDebtSyncPayload({ ...newDebt, id })
    .then(payload => syncDebt(payload, uid).catch(() => {}))
    .catch(() => {});
  return id;
}

// Marcar como paga
export async function markAsPaid(id) {
  const paidAt = new Date().toISOString();
  await db.debts.update(id, { isPaid: true, paidAt, updatedAt: paidAt });
  const debt = await db.debts.get(id);
  if (debt) {
    getDebtSyncPayload(debt)
      .then(payload => syncDebt(payload, getCurrentUserId()).catch(() => {}))
      .catch(() => {});
  }
  return id;
}

// Marcar como não paga
export async function markAsUnpaid(id) {
  await db.debts.update(id, { isPaid: false, paidAt: null, updatedAt: new Date().toISOString() });
  const debt = await db.debts.get(id);
  if (debt) {
    getDebtSyncPayload(debt)
      .then(payload => syncDebt(payload, getCurrentUserId()).catch(() => {}))
      .catch(() => {});
  }
  return id;
}

// Atualizar dívida
export async function updateDebt(id, changes) {
  await db.debts.update(id, { ...changes, updatedAt: new Date().toISOString() });
  const debt = await db.debts.get(id);
  if (debt) {
    getDebtSyncPayload(debt)
      .then(payload => syncDebt(payload, getCurrentUserId()).catch(() => {}))
      .catch(() => {});
  }
  return id;
}

// Deletar dívida
export async function deleteDebt(id) {
  const debt = await db.debts.get(id);
  await db.debts.delete(id);
  if (debt) {
    deleteDebtSync(debt, getCurrentUserId()).catch(() => {});
  }
}

// Buscar todas as dívidas pendentes ordenadas por vencimento
export async function getPendingDebts() {
  return await db.debts
    .where('isPaid')
    .equals(0)
    .sortBy('dueDate');
}

// Buscar dívidas de um mês específico
export async function getMonthDebts(year, month) {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  return await db.debts
    .where('dueDate')
    .between(start, end, true, true)
    .toArray();
}

// Buscar todas as dívidas
export async function getAllDebts() {
  return await db.debts.orderBy('dueDate').toArray();
}

// Métricas do dashboard
export async function getDashboardMetrics() {
  const allDebts = await db.debts.toArray();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const pending = allDebts.filter(d => !d.isPaid);
  const paid = allDebts.filter(d => d.isPaid);

  const totalPending = pending.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = paid.reduce((sum, d) => sum + d.amount, 0);

  const monthDebts = allDebts.filter(d => {
    const date = new Date(d.dueDate);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthPending = monthDebts.filter(d => !d.isPaid).reduce((sum, d) => sum + d.amount, 0);

  // Dívida mais urgente (mais próxima do vencimento, não paga)
  const urgentDebt = pending
    .filter(d => new Date(d.dueDate) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;

  // Dívidas vencidas não pagas
  const overdueDebts = pending
    .filter(d => new Date(d.dueDate) < new Date(now.toDateString()));

  // Próximas 5 dívidas
  const upcoming = pending
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  return {
    totalPending,
    totalPaid,
    totalAll: totalPending + totalPaid,
    monthPending,
    monthTotal: monthDebts.reduce((sum, d) => sum + d.amount, 0),
    urgentDebt: overdueDebts.length > 0 ? overdueDebts[0] : urgentDebt,
    upcoming,
    overdueCount: overdueDebts.length,
    paidCount: paid.length,
    pendingCount: pending.length,
  };
}

// Transações (Receitas & Despesas)
export async function addTransaction(transaction) {
  const nowIso = new Date().toISOString();
  const newTransaction = buildNormalizedTransaction({
    ...transaction,
    amount: parseFloat(transaction.amount),
    isPaid: transaction.isPaid ?? (transaction.type === 'receita'),
    paidAt: transaction.isPaid ? new Date().toISOString() : null,
    createdAt: nowIso,
  }, nowIso);
  const id = await db.transactions.add(newTransaction);
  getTransactionSyncPayload({ ...newTransaction, id })
    .then(payload => syncTransaction(payload, getCurrentUserId()).catch(() => {}))
    .catch(() => {});
  return id;
}

export async function updateTransaction(id, changes) {
  await db.transactions.update(id, { ...changes, updatedAt: new Date().toISOString() });
  const transaction = await db.transactions.get(id);
  if (transaction) {
    getTransactionSyncPayload(transaction)
      .then(payload => syncTransaction(payload, getCurrentUserId()).catch(() => {}))
      .catch(() => {});
  }
  return id;
}

export async function deleteTransaction(id) {
  const transaction = await db.transactions.get(id);
  await db.transactions.delete(id);
  if (transaction) {
    deleteTransactionSync(transaction, getCurrentUserId()).catch(() => {});
  }
  return id;
}

export async function markTransactionAsPaid(id) {
  const updatedAt = new Date().toISOString();
  await db.transactions.update(id, {
    isPaid: true,
    paidAt: updatedAt,
    updatedAt,
  });
  const transaction = await db.transactions.get(id);
  if (transaction) {
    getTransactionSyncPayload(transaction)
      .then(payload => syncTransaction(payload, getCurrentUserId()).catch(() => {}))
      .catch(() => {});
  }
  return id;
}

export async function markTransactionAsUnpaid(id) {
  await db.transactions.update(id, {
    isPaid: false,
    paidAt: null,
    updatedAt: new Date().toISOString(),
  });
  const transaction = await db.transactions.get(id);
  if (transaction) {
    getTransactionSyncPayload(transaction)
      .then(payload => syncTransaction(payload, getCurrentUserId()).catch(() => {}))
      .catch(() => {});
  }
  return id;
}

export async function getMonthTransactions(year, month) {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  return await db.transactions
    .where('date')
    .between(start, end, true, true)
    .toArray();
}

// Categorias de Transações
export async function addTransactionCategory(category) {
  const nowIso = new Date().toISOString();
  const newCategory = buildNormalizedTransactionCategory({
    ...category,
    isDefault: false,
    createdAt: nowIso,
  }, nowIso);
  const id = await db.transactionCategories.add(newCategory);
  syncTransactionCategory({ ...newCategory, id }, getCurrentUserId()).catch(() => {});
  return id;
}

export async function updateTransactionCategory(id, changes) {
  await db.transactionCategories.update(id, { ...changes, updatedAt: new Date().toISOString() });
  const category = await db.transactionCategories.get(id);
  if (category) {
    syncTransactionCategory(category, getCurrentUserId()).catch(() => {});
  }
  return id;
}

export async function deleteTransactionCategory(id) {
  const category = await db.transactionCategories.get(id);
  if (!category) return id;

  const fallback = await db.transactionCategories
    .filter(cat => cat.type === category.type && cat.isDefault && cat.id !== id)
    .first();
  const affectedIds = (await db.transactions.where('categoryId').equals(id).toArray()).map(item => item.id);

  if (fallback) {
    await db.transactions.where('categoryId').equals(id).modify({
      categoryId: fallback.id,
      updatedAt: new Date().toISOString(),
    });
  }

  await db.transactionCategories.delete(id);
  deleteTransactionCategorySync(category, getCurrentUserId()).catch(() => {});

  if (fallback && affectedIds.length > 0) {
    for (const transactionId of affectedIds) {
      const transaction = await db.transactions.get(transactionId);
      if (transaction) {
        getTransactionSyncPayload(transaction)
          .then(payload => syncTransaction(payload, getCurrentUserId()).catch(() => {}))
          .catch(() => {});
      }
    }
  }

  return id;
}

// Categorias de Dívidas
export async function addDebtCategory(category) {
  const nowIso = new Date().toISOString();
  const newCategory = buildNormalizedDebtCategory({
    ...category,
    isDefault: false,
    createdAt: nowIso,
  }, nowIso);
  const id = await db.debtCategories.add(newCategory);
  syncDebtCategory({ ...newCategory, id }, getCurrentUserId()).catch(() => {});
  return id;
}

export async function updateDebtCategory(id, changes) {
  await db.debtCategories.update(id, { ...changes, updatedAt: new Date().toISOString() });
  const category = await db.debtCategories.get(id);
  if (category) {
    syncDebtCategory(category, getCurrentUserId()).catch(() => {});
  }
  return id;
}

export async function deleteDebtCategory(id) {
  // Reatribuir dívidas dessa categoria para "Outros"
  const category = await db.debtCategories.get(id);
  const outros = await db.debtCategories.filter(c => c.name === 'Outros').first();
  const affectedIds = (await db.debts.where('categoryId').equals(id).toArray()).map(item => item.id);

  if (outros) {
    await db.debts.where('categoryId').equals(id).modify({
      categoryId: outros.id,
      updatedAt: new Date().toISOString(),
    });
  }

  await db.debtCategories.delete(id);
  if (category) {
    deleteDebtCategorySync(category, getCurrentUserId()).catch(() => {});
  }

  if (outros && affectedIds.length > 0) {
    for (const debtId of affectedIds) {
      const debt = await db.debts.get(debtId);
      if (debt) {
        getDebtSyncPayload(debt)
          .then(payload => syncDebt(payload, getCurrentUserId()).catch(() => {}))
          .catch(() => {});
      }
    }
  }

  return id;
}
