import Dexie from 'dexie';

export const db = new Dexie('GestorDeDividas');

db.version(1).stores({
  debts: '++id, name, amount, dueDate, category, recurrence, installments, currentInstallment, isPaid, paidAt, createdAt, parentId',
  settings: 'key'
});

// Adicionar nova dívida
export async function addDebt(debt) {
  const now = new Date();
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
      
      const id = await db.debts.add({
        ...baseDebt,
        name: `${debt.name} (${i + 1}/${totalInstallments})`,
        amount: installmentAmount,
        dueDate: dueDate.toISOString(),
        currentInstallment: i + 1,
        installments: totalInstallments,
        parentId: i === 0 ? null : 'batch',
      });
      ids.push(id);
    }
    return ids;
  }

  return await db.debts.add({
    ...baseDebt,
    dueDate: new Date(debt.dueDate).toISOString(),
    installments: debt.recurrence === 'parcelada' ? 1 : null,
    currentInstallment: debt.recurrence === 'parcelada' ? 1 : null,
  });
}

// Marcar como paga
export async function markAsPaid(id) {
  return await db.debts.update(id, {
    isPaid: true,
    paidAt: new Date().toISOString(),
  });
}

// Marcar como não paga
export async function markAsUnpaid(id) {
  return await db.debts.update(id, {
    isPaid: false,
    paidAt: null,
  });
}

// Atualizar dívida
export async function updateDebt(id, changes) {
  return await db.debts.update(id, changes);
}

// Deletar dívida
export async function deleteDebt(id) {
  return await db.debts.delete(id);
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
