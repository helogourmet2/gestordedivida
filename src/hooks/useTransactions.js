import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  markTransactionAsPaid,
  markTransactionAsUnpaid,
  addTransactionCategory,
  updateTransactionCategory,
  deleteTransactionCategory,
} from '../db/database';

export function useTransactions() {
  const allTransactions = useLiveQuery(
    () => db.transactions.orderBy('date').reverse().toArray(),
    []
  );

  const categories = useLiveQuery(
    () => db.transactionCategories.orderBy('name').toArray(),
    []
  );

  return {
    allTransactions: allTransactions || [],
    categories: categories || [],
    addTransaction,
    updateTransaction,
    deleteTransaction,
    markTransactionAsPaid,
    markTransactionAsUnpaid,
    addTransactionCategory,
    updateTransactionCategory,
    deleteTransactionCategory,
  };
}

export function useMonthSummary(year, month) {
  const summary = useLiveQuery(async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

    const transactions = await db.transactions
      .where('date')
      .between(start, end, true, true)
      .toArray();

    // Saldo considera apenas transações pagas/recebidas
    const totalReceitas = transactions
      .filter(t => t.type === 'receita' && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDespesas = transactions
      .filter(t => t.type === 'despesa' && t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);

    // Pendentes (despesas não pagas)
    const totalPendente = transactions
      .filter(t => t.type === 'despesa' && !t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);

    // A receber (receitas não recebidas)
    const totalAReceber = transactions
      .filter(t => t.type === 'receita' && !t.isPaid)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalReceitas,
      totalDespesas,
      totalPendente,
      totalAReceber,
      saldo: totalReceitas - totalDespesas,
      transactions,
    };
  }, [year, month]);

  return summary || {
    totalReceitas: 0,
    totalDespesas: 0,
    totalPendente: 0,
    totalAReceber: 0,
    saldo: 0,
    transactions: [],
  };
}
