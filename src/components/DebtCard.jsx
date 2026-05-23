import { CheckCircle2, Undo2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, daysUntilDue, daysUntilDueText } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';

export default function DebtCard({ debt, onMarkPaid, onMarkUnpaid, onDelete, compact = false }) {
  const days = daysUntilDue(debt.dueDate);
  const isOverdue = days < 0 && !debt.isPaid;
  const isToday = days === 0 && !debt.isPaid;
  const isSoon = days > 0 && days <= 3 && !debt.isPaid;

  return (
    <div className={`group rounded-2xl p-4 border transition-all duration-200 ${
      debt.isPaid
        ? 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-60'
        : isOverdue
          ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900'
          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold truncate ${
              compact ? 'text-sm' : 'text-base'
            } ${debt.isPaid ? 'line-through' : ''}`}>
              {debt.name}
            </h3>
            <CategoryBadge categoryId={debt.category} />
          </div>
          
          <div className="flex items-center gap-3 mt-1">
            <span className={`font-mono font-bold ${
              compact ? 'text-base' : 'text-lg'
            } ${
              debt.isPaid 
                ? 'text-neutral-400 dark:text-neutral-600' 
                : isOverdue 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-neutral-900 dark:text-neutral-100'
            }`}>
              {formatCurrency(debt.amount)}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs ${
              debt.isPaid
                ? 'text-neutral-400'
                : isOverdue
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : isToday
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : isSoon
                      ? 'text-orange-500 font-medium'
                      : 'text-neutral-500 dark:text-neutral-400'
            }`}>
              {debt.isPaid ? `Paga em ${formatDate(debt.paidAt)}` : daysUntilDueText(debt.dueDate)}
            </span>
            <span className="text-neutral-300 dark:text-neutral-700">·</span>
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {formatDate(debt.dueDate)}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center gap-1">
          {!debt.isPaid ? (
            <button
              onClick={() => onMarkPaid(debt.id)}
              className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950 transition-colors active:scale-95"
              aria-label="Marcar como paga"
            >
              <CheckCircle2 size={18} />
            </button>
          ) : (
            <button
              onClick={() => onMarkUnpaid(debt.id)}
              className="p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors active:scale-95"
              aria-label="Desfazer pagamento"
            >
              <Undo2 size={18} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(debt.id)}
              className="p-2.5 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-colors active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Excluir dívida"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
