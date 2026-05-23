import { useLiveQuery } from 'dexie-react-hooks';
import { db, addDebt, markAsPaid, markAsUnpaid, deleteDebt, updateDebt } from '../db/database';

export function useDebts() {
  const allDebts = useLiveQuery(
    () => db.debts.orderBy('dueDate').toArray(),
    []
  );

  const pendingDebts = useLiveQuery(
    () => db.debts.filter(d => !d.isPaid).sortBy('dueDate'),
    []
  );

  return {
    allDebts: allDebts || [],
    pendingDebts: pendingDebts || [],
    addDebt,
    markAsPaid,
    markAsUnpaid,
    deleteDebt,
    updateDebt,
  };
}
