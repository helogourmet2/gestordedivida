import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';

export default function CategoryBadge({ categoryId }) {
  const numId = categoryId != null ? Number(categoryId) : null;

  const category = useLiveQuery(
    () => {
      if (!numId || isNaN(numId)) return Promise.resolve(null);
      return db.debtCategories.get(numId);
    },
    [numId]
  );

  if (!category) return null;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white ${category.color}`}>
      {category.name}
    </span>
  );
}
