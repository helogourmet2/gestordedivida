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

  return (
    <>
      <div className={`group rounded-2xl p-4 border transition-all duration-200 ${
        debt.isPaid
          ? 'bg-[#0f2040]/60 border-[#1a3366]/50 opacity-70'
          : isOverdue
            ? 'bg-red-950/40 border-red-800/60'
            : 'bg-[#0f2040] border-[#1a3366] hover:border-[#2a52a0]'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold truncate ${
                compact ? 'text-sm' : 'text-base'
              } ${debt.isPaid ? 'line-through text-[#6b93d6]' : 'text-white'}`}>
                {debt.name}
              </h3>
              <CategoryBadge categoryId={debt.category} />
            </div>

            <div className="flex items-center gap-3 mt-1">
              <span className={`font-mono font-bold ${
                compact ? 'text-base' : 'text-lg'
              } ${
                debt.isPaid
                  ? 'text-[#6b93d6]'
                  : isOverdue
                    ? 'text-red-400'
                    : 'text-white'
              }`}>
                {formatCurrency(debt.amount)}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs ${
                debt.isPaid
                  ? 'text-[#6b93d6]'
                  : isOverdue
                    ? 'text-red-400 font-semibold'
                    : isToday
                      ? 'text-red-400 font-semibold'
                      : isSoon
                        ? 'text-orange-400 font-medium'
                        : 'text-[#b8cef0]'
              }`}>
                {debt.isPaid ? `Paga em ${formatDate(debt.paidAt)}` : daysUntilDueText(debt.dueDate)}
              </span>
              <span className="text-[#1a3366]">·</span>
              <span className="text-xs text-[#6b93d6]">
                {formatDate(debt.dueDate)}
              </span>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-1">
            {/* Editar — sempre visível */}
            <button
              onClick={() => setShowEdit(true)}
              className="p-2.5 rounded-xl bg-[#152a55] text-[#6b93d6] hover:bg-[#1a3366] hover:text-[#b8cef0] transition-colors active:scale-95"
              aria-label="Editar dívida"
            >
              <Pencil size={16} />
            </button>

            {/* Pagar / Desfazer */}
            {!debt.isPaid ? (
              <button
                onClick={() => onMarkPaid(debt.id)}
                className="p-2.5 rounded-xl bg-red-900/40 text-red-400 hover:bg-red-900/70 transition-colors active:scale-95"
                aria-label="Marcar como paga"
              >
                <CheckCircle2 size={18} />
              </button>
            ) : (
              <button
                onClick={() => onMarkUnpaid(debt.id)}
                className="p-2.5 rounded-xl bg-[#152a55] text-[#6b93d6] hover:bg-[#1a3366] transition-colors active:scale-95"
                aria-label="Desfazer pagamento"
              >
                <Undo2 size={18} />
              </button>
            )}

            {/* Excluir */}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm(`Excluir "${debt.name}"?`)) onDelete(debt.id);
                }}
                className="p-2.5 rounded-xl text-[#6b93d6] hover:bg-red-900/40 hover:text-red-400 transition-colors active:scale-95"
                aria-label="Excluir dívida"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edição */}
      {showEdit && (
        <DebtForm
          debt={debt}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  );
}
