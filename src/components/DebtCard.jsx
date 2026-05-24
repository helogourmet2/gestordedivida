import { useState } from 'react';
import { CheckCircle2, Undo2, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatDate, daysUntilDue, daysUntilDueText } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';
import DebtForm from './DebtForm';

export default function DebtCard({ debt, onMarkPaid, onMarkUnpaid, onDelete, compact = false }) {
  const [showEdit, setShowEdit] = useState(false);
  const days = daysUntilDue(debt.dueDate);
  const isOverdue = days < 0 && !debt.isPaid;
  const isToday = days === 0 && !debt.isPaid;
  const isSoon = days > 0 && days <= 3 && !debt.isPaid;

  const cardStyle = debt.isPaid
    ? { background: 'var(--card)', border: '1px solid var(--border)', opacity: 0.6 }
    : isOverdue
      ? { background: 'rgba(229,0,0,0.08)', border: '1px solid rgba(229,0,0,0.35)' }
      : { background: 'var(--card)', border: '1px solid var(--border)' };

  return (
    <>
      <div className="group rounded-2xl p-4 transition-all duration-200" style={cardStyle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">

            {/* Nome + categoria */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className={`font-bold truncate ${compact ? 'text-sm' : 'text-base'} ${
                debt.isPaid ? 'line-through' : ''
              }`} style={{ color: debt.isPaid ? 'var(--gray-3)' : 'var(--white)' }}>
                {debt.name}
              </h3>
              <CategoryBadge categoryId={debt.categoryId} />
            </div>

            {/* Valor */}
            <p className={`font-mono font-extrabold ${compact ? 'text-base' : 'text-xl'}`}
              style={{ color: debt.isPaid ? 'var(--gray-3)' : isOverdue ? 'var(--red)' : 'var(--white)' }}>
              {formatCurrency(debt.amount)}
            </p>

            {/* Status data */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-semibold" style={{
                color: debt.isPaid ? 'var(--gray-2)'
                  : isOverdue || isToday ? 'var(--red)'
                  : isSoon ? '#ff8800'
                  : 'var(--gray-2)'
              }}>
                {debt.isPaid ? `Paga em ${formatDate(debt.paidAt)}` : daysUntilDueText(debt.dueDate)}
              </span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--gray-2)' }}>
                {formatDate(debt.dueDate)}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowEdit(true)}
              className="p-2.5 rounded-xl transition-all active:scale-90"
              style={{ background: 'var(--card-2)', color: 'var(--gray-2)' }}
              aria-label="Editar"
            >
              <Pencil size={15} />
            </button>

            {!debt.isPaid ? (
              <button
                onClick={() => onMarkPaid(debt.id)}
                className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--red-dim)', color: 'var(--red)' }}
                aria-label="Marcar como paga"
              >
                <CheckCircle2 size={18} />
              </button>
            ) : (
              <button
                onClick={() => onMarkUnpaid(debt.id)}
                className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--card-2)', color: 'var(--gray-2)' }}
                aria-label="Desfazer"
              >
                <Undo2 size={18} />
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => { if (window.confirm(`Excluir "${debt.name}"?`)) onDelete(debt.id); }}
                className="p-2.5 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--gray-3)' }}
                aria-label="Excluir"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showEdit && <DebtForm debt={debt} onClose={() => setShowEdit(false)} />}
    </>
  );
}
