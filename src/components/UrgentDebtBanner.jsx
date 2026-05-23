import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency, daysUntilDue, daysUntilDueText } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';

export default function UrgentDebtBanner({ debt, onMarkPaid }) {
  if (!debt) return null;

  const days = daysUntilDue(debt.dueDate);
  const isOverdue = days < 0;
  const isToday = days === 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 mb-4 ${
      isOverdue 
        ? 'bg-red-600 text-white' 
        : isToday 
          ? 'bg-red-600 text-white'
          : 'bg-neutral-900 dark:bg-neutral-800 text-white'
    }`}>
      {/* Círculo decorativo */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10 ${
        isOverdue || isToday ? 'bg-white' : 'bg-red-500'
      }`} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {isOverdue || isToday ? (
            <AlertTriangle size={16} className="animate-pulse" />
          ) : (
            <Clock size={16} />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            {isOverdue ? 'Dívida Vencida' : isToday ? 'Vence Hoje!' : 'Próximo Vencimento'}
          </span>
        </div>
        
        <h2 className="text-lg font-bold mb-1 truncate">{debt.name}</h2>
        
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(debt.amount)}
            </p>
            <p className="text-xs mt-1 opacity-75">
              {daysUntilDueText(debt.dueDate)}
            </p>
          </div>
          
          <button
            onClick={() => onMarkPaid(debt.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
              isOverdue || isToday
                ? 'bg-white text-red-600 hover:bg-neutral-100'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            <CheckCircle2 size={16} />
            Pagar
          </button>
        </div>
      </div>
    </div>
  );
}
