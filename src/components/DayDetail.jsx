import { CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';

export default function DayDetail({ date, debts, onMarkPaid }) {
  if (!debts || debts.length === 0) {
    return (
      <div className="mt-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-center">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Nenhuma dívida para {formatDate(date.toISOString())}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2 animate-fade-in">
      <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-2">
        {formatDate(date.toISOString())} — {debts.length} dívida{debts.length > 1 ? 's' : ''}
      </h3>
      {debts.map(debt => (
        <div
          key={debt.id}
          className={`flex items-center justify-between p-3 rounded-xl border ${
            debt.isPaid
              ? 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-60'
              : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
          }`}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-semibold truncate ${debt.isPaid ? 'line-through' : ''}`}>
                {debt.name}
              </span>
              <CategoryBadge categoryId={debt.category} />
            </div>
            <span className="text-sm font-mono font-bold text-red-600 dark:text-red-400">
              {formatCurrency(debt.amount)}
            </span>
          </div>
          {!debt.isPaid && (
            <button
              onClick={() => onMarkPaid(debt.id)}
              className="ml-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 transition-colors active:scale-95"
              aria-label="Marcar como paga"
            >
              <CheckCircle2 size={18} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
