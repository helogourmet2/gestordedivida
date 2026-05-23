import Dexie from 'dexie';
import { syncDebt, deleteDebtSync } from '../lib/supabase';
import { auth } from '../lib/firebase';

function getCurrentUserId() {
  return auth?.currentUser?.uid ?? null;
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
  // Seed das categorias padrão de transações
  await tx.table('transactionCategories').bulkAdd([
    { name: 'Salário',         type: 'receita',  color: 'bg-green-600',   icon: 'Banknote',      isDefault: true },
    { name: 'Aluguel recebido',type: 'receita',  color: 'bg-emerald-500', icon: 'Home',          isDefault: true },
    { name: 'Saque cassino',   type: 'receita',  color: 'bg-yellow-500',  icon: 'TrendingUp',    isDefault: true },
    { name: 'Extra',           type: 'receita',  color: 'bg-blue-500',    icon: 'Plus',          isDefault: true },
    { name: 'Pagamento',       type: 'despesa',  color: 'bg-red-600',     icon: 'CreditCard',    isDefault: true },
    { name: 'Aluguel',         type: 'despesa',  color: 'bg-orange-500',  icon: 'Home',          isDefault: true },
    { name: 'Depósito cassino',type: 'despesa',  color: 'bg-purple-500',  icon: 'TrendingDown',  isDefault: true },
    { name: 'Extra',           type: 'despesa',  color: 'bg-neutral-500', icon: 'MoreHorizontal',isDefault: true },
  ]);
});

db.version(3).stores({
  debts: '++id, name, amount, dueDate, categoryId, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key',
  transactions: '++id, type, amount, date, categoryId, description, isPaid, paidAt, createdAt',
  transactionCategories: '++id, name, type, color, icon, isDefault',
  debtCategories: '++id, name, color, isDefault',
}).upgrade(async tx => {
  // Seed das categorias padrão de dívidas
  const catIds = await tx.table('debtCategories').bulkAdd([
    { name: 'Essencial', color: 'bg-red-600',    isDefault: true },
    { name: 'Cartão',    color: 'bg-orange-500', isDefault: true },
    { name: 'Lazer',     color: 'bg-purple-500', isDefault: true },
    { name: 'Outros',    color: 'bg-neutral-500',isDefault: true },
  ], { allKeys: true });

  // Migrar dívidas existentes: converter category string → categoryId numérico
  const nameToId = { essencial: catIds[0], cartao: catIds[1], lazer: catIds[2], outros: catIds[3] };
  const allDebts = await tx.table('debts').toArray();
  for (const debt of allDebts) {
    const newCatId = nameToId[debt.category] ?? catIds[3];
    await tx.table('debts').update(debt.id, { categoryId: newCatId });
  }
});

// Adicionar nova dívida
export async function addDebt(debt) {
  const now = new Date();
  const uid = getCurrentUserId();
  const baseDebt = {
    ...debt,
    amount: parseFloat(debt.amount),
    isPaid: false,
    paidAt: null,
    createdAt: now,
    parentId: null,
  };

  if (debt.recurrence === 'parcelada' && debt.installments > 1) {
    const ids = [];
    const totalInstallments = parseInt(debt.installments);
    const installmentAmount = parseFloat((baseDebt.amount / totalInstallments).toFixed(2));

    for (let i = 0; i < totalInstallments; i++) {
      const dueDate = new Date(debt.dueDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      const newDebt = {
        ...baseDebt,
        name: `${debt.name} (${i + 1}/${totalInstallments})`,
        amount: installmentAmount,
        dueDate: dueDate.toISOString(),
        currentInstallment: i + 1,
        installments: totalInstallments,
        parentId: i === 0 ? null : 'batch',
      };
      const id = await db.debts.add(newDebt);
      ids.push(id);
      // Sync em background — não bloqueia a UI
      syncDebt({ ...newDebt, id }, uid).catch(() => {});
    }
    return ids;
  }

  const newDebt = {
    ...baseDebt,
    dueDate: new Date(debt.dueDate).toISOString(),
    installments: debt.recurrence === 'parcelada' ? 1 : null,
    currentInstallment: debt.recurrence === 'parcelada' ? 1 : null,
  };
  const id = await db.debts.add(newDebt);
  syncDebt({ ...newDebt, id }, uid).catch(() => {});
  return id;
}

// Marcar como paga
export async function markAsPaid(id) {
  const paidAt = new Date().toISOString();
  await db.debts.update(id, { isPaid: true, paidAt });
  const debt = await db.debts.get(id);
  if (debt) syncDebt(debt, getCurrentUserId()).catch(() => {});
  return id;
}

// Marcar como não paga
export async function markAsUnpaid(id) {
  await db.debts.update(id, { isPaid: false, paidAt: null });
  const debt = await db.debts.get(id);
  if (debt) syncDebt(debt, getCurrentUserId()).catch(() => {});
  return id;
}

// Atualizar dívida
export async function updateDebt(id, changes) {
  await db.debts.update(id, changes);
  const debt = await db.debts.get(id);
  if (debt) syncDebt(debt, getCurrentUserId()).catch(() => {});
  return id;
}

// Deletar dívida
export async function deleteDebt(id) {
  await db.debts.delete(id);
  deleteDebtSync(id, getCurrentUserId()).catch(() => {});
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

// ─── Transações (Receitas & Despesas) ────────────────────────────────────────

export async function addTransaction(transaction) {
  return await db.transactions.add({
    ...transaction,
    amount: parseFloat(transaction.amount),
    isPaid: transaction.isPaid ?? (transaction.type === 'receita'), // receita já entra como recebida por padrão
    paidAt: transaction.isPaid ? new Date().toISOString() : null,
    createdAt: new Date().toISOString(),
  });
}

export async function updateTransaction(id, changes) {
  return await db.transactions.update(id, changes);
}

export async function deleteTransaction(id) {
  return await db.transactions.delete(id);
}

export async function markTransactionAsPaid(id) {
  return await db.transactions.update(id, {
    isPaid: true,
    paidAt: new Date().toISOString(),
  });
}

export async function markTransactionAsUnpaid(id) {
  return await db.transactions.update(id, {
    isPaid: false,
    paidAt: null,
  });
}

export async function getMonthTransactions(year, month) {
  const start = new Date(year, month, 1).toISOString();
  const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  return await db.transactions
    .where('date')
    .between(start, end, true, true)
    .toArray();
}

// ─── Categorias de Transações ─────────────────────────────────────────────────

export async function addTransactionCategory(category) {
  return await db.transactionCategories.add({
    ...category,
    isDefault: false,
  });
}

export async function updateTransactionCategory(id, changes) {
  return await db.transactionCategories.update(id, changes);
}

export async function deleteTransactionCategory(id) {
  return await db.transactionCategories.delete(id);
}

// ─── Categorias de Dívidas ────────────────────────────────────────────────────

export async function addDebtCategory(category) {
  return await db.debtCategories.add({ ...category, isDefault: false });
}

export async function updateDebtCategory(id, changes) {
  return await db.debtCategories.update(id, changes);
}

export async function deleteDebtCategory(id) {
  // Reatribuir dívidas dessa categoria para "Outros" (id menor padrão)
  const outros = await db.debtCategories.filter(c => c.name === 'Outros').first();
  if (outros) {
    await db.debts.where('categoryId').equals(id).modify({ categoryId: outros.id });
  }
  return await db.debtCategories.delete(id);
}
