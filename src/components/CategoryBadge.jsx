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

  // Extrai a cor base da classe Tailwind para usar como background inline
  const colorMap = {
    'bg-red-600':     '#dc2626',
    'bg-orange-500':  '#f97316',
    'bg-purple-500':  '#a855f7',
    'bg-neutral-500': '#737373',
    'bg-green-600':   '#16a34a',
    'bg-blue-500':    '#3b82f6',
    'bg-yellow-500':  '#eab308',
    'bg-pink-500':    '#ec4899',
    'bg-emerald-500': '#10b981',
  };
  const bg = colorMap[category.color] || '#737373';

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
      style={{ background: bg }}
    >
      {category.name}
    </span>
  );
}
