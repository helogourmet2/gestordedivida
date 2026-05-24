import { useState } from 'react';
import { CheckCircle2, Undo2, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatDate, daysUntilDue, daysUntilDueText } from '../utils/formatters';
import CategoryBadge from './CategoryBadge';
import DebtForm from './DebtForm';

export default function DebtCard({ debt, onMarkPaid, onMarkUnpaid, onDelete, compact = false }) {
  const [showEdit, setShowEdit] = useState(false);
  const days = daysUntilDue(debt.dueDate);
  const isOverdue = days < 0 && !debt.isPaid;
  const isToday  = days === 0 && !debt.isPaid;
  const isSoon   = days > 0 && days <= 3 && !debt.isPaid;
  const urgent   = isOverdue || isToday;

  // ── Estilos do card ──────────────────────────────────────────────────────
  const cardBg     = debt.isPaid ? '#111111' : urgent ? '#e50000' : '#1a1a1a';
  const cardBorder = debt.isPaid ? '1px solid #2a2a2a'
                   : urgent      ? 'none'
                   :               '1px solid #2a2a2a';
  const cardOpacity = debt.isPaid ? 0.55 : 1;

  const nameColor   = debt.isPaid ? '#555' : '#fff';
  const amountColor = debt.isPaid ? '#555' : urgent ? '#fff' : '#fff';
  const statusColor = debt.isPaid ? '#555'
                    : urgent      ? 'rgba(255,255,255,0.85)'
                    : isSoon      ? '#ff8800'
                    : '#a0a0a0';

  return (
    <>
      <div
        className="group rounded-2xl p-4 transition-all duration-200"
        style={{ background: cardBg, border: cardBorder, opacity: cardOpacity }}
      >
        <div className="flex items-start justify-between gap-3">

          {/* ── Conteúdo ── */}
          <div className="flex-1 min-w-0">

            {/* Nome + badge */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3
                className={`font-bold truncate ${compact ? 'text-sm' : 'text-base'} ${debt.isPaid ? 'line-through' : ''}`}
                style={{ color: nameColor }}
              >
                {debt.name}
              </h3>
              <CategoryBadge categoryId={debt.categoryId} />
            </div>

            {/* Valor */}
            <p
              className={`font-mono font-black ${compact ? 'text-base' : 'text-xl'}`}
              style={{ color: amountColor }}
            >
              {formatCurrency(debt.amount)}
            </p>

            {/* Status + data */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-xs font-semibold" style={{ color: statusColor }}>
                {debt.isPaid ? `Paga em ${formatDate(debt.paidAt)}` : daysUntilDueText(debt.dueDate)}
              </span>
              <span style={{ color: '#333' }}>·</span>
              <span className="text-xs" style={{ color: urgent ? 'rgba(255,255,255,0.65)' : '#555' }}>
                {formatDate(debt.dueDate)}
              </span>
            </div>
          </div>

          {/* ── Ações ── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Editar */}
            <button
              onClick={() => setShowEdit(true)}
              className="p-2.5 rounded-xl transition-all active:scale-90"
              style={{
                background: urgent ? 'rgba(255,255,255,0.15)' : '#2a2a2a',
                color: urgent ? '#fff' : '#a0a0a0',
              }}
              aria-label="Editar"
            >
              <Pencil size={15} />
            </button>

            {/* Pagar / Desfazer */}
            {!debt.isPaid ? (
              <button
                onClick={() => onMarkPaid(debt.id)}
                className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{
                  background: urgent ? '#fff' : 'rgba(229,0,0,0.15)',
                  color: urgent ? '#e50000' : '#e50000',
                }}
                aria-label="Marcar como paga"
              >
                <CheckCircle2 size={18} />
              </button>
            ) : (
              <button
                onClick={() => onMarkUnpaid(debt.id)}
                className="p-2.5 rounded-xl transition-all active:scale-90"
                style={{ background: '#2a2a2a', color: '#a0a0a0' }}
                aria-label="Desfazer"
              >
                <Undo2 size={18} />
              </button>
            )}

            {/* Excluir */}
            {onDelete && (
              <button
                onClick={() => { if (window.confirm(`Excluir "${debt.name}"?`)) onDelete(debt.id); }}
                className="p-2.5 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                style={{ color: urgent ? 'rgba(255,255,255,0.5)' : '#444' }}
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
