import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { formatCurrency, daysUntilDue, daysUntilDueText } from '../utils/formatters';

export default function UrgentDebtBanner({ debt, onMarkPaid }) {
  if (!debt) return null;

  const days = daysUntilDue(debt.dueDate);
  const isOverdue = days < 0;
  const isToday = days === 0;
  const urgent = isOverdue || isToday;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 mb-4"
      style={{
        background: urgent ? 'var(--red)' : 'var(--card)',
        border: urgent ? 'none' : '1px solid var(--border)',
      }}
    >
      {/* Círculo decorativo */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full opacity-10"
        style={{ background: urgent ? '#fff' : 'var(--red)' }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          {urgent
            ? <AlertTriangle size={15} className="animate-pulse" color="#fff" />
            : <Clock size={15} style={{ color: 'var(--gray-2)' }} />
          }
          <span className="text-xs font-bold uppercase tracking-widest"
            style={{ color: urgent ? 'rgba(255,255,255,0.85)' : 'var(--gray-2)' }}>
            {isOverdue ? 'Dívida Vencida' : isToday ? 'Vence Hoje!' : 'Próximo Vencimento'}
          </span>
        </div>

        <h2 className="text-lg font-black mb-1 truncate"
          style={{ color: urgent ? '#fff' : 'var(--white)' }}>
          {debt.name}
        </h2>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black font-mono"
              style={{ color: urgent ? '#fff' : 'var(--white)' }}>
              {formatCurrency(debt.amount)}
            </p>
            <p className="text-xs mt-1"
              style={{ color: urgent ? 'rgba(255,255,255,0.75)' : 'var(--gray-2)' }}>
              {daysUntilDueText(debt.dueDate)}
            </p>
          </div>

          <button
            onClick={() => onMarkPaid(debt.id)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={urgent
              ? { background: '#fff', color: 'var(--red)' }
              : { background: 'var(--red)', color: '#fff' }
            }
          >
            <CheckCircle2 size={16} />
            Pagar
          </button>
        </div>
      </div>
    </div>
  );
}
