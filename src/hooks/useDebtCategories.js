import { useLiveQuery } from 'dexie-react-hooks';
import { db, addDebtCategory, updateDebtCategory, deleteDebtCategory } from '../db/database';

export function useDebtCategories() {
  const categories = useLiveQuery(
    () => db.debtCategories.orderBy('name').toArray(),
    []
  );

  return {
    categories: categories || [],
    addDebtCategory,
    updateDebtCategory,
    deleteDebtCategory,
  };
}
