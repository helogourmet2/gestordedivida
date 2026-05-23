import { CATEGORIES } from '../utils/constants';

export default function CategoryBadge({ categoryId }) {
  const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[3];
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white ${category.color}`}>
      {category.label}
    </span>
  );
}
