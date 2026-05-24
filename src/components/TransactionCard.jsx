import { CheckCircle2, Undo2, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionCard({ transaction, category, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const isReceita = transaction.type === 'receita';
  const isPaid = transaction.isPaid;

  const cardStyle = isReceita
    ? { background: 'rgba(0,200,83,0.07)', border: '1px solid rgba(0,200,83,0.25)' }
    : { background: 'rgba(229,0,0,0.07)', border: '1px solid rgba(229,0,0,0.25)' };

  const valueColor = isReceita ? 'var(--green)' : 'var(--red)';
  const textColor  = isReceita ? '#00c853' : '#e50000';

  return (
    <div className="group rounded-2xl p-4 transition-all duration-200" style={cardStyle}>
      <div className="flex items-start justify-between gap-3">

        {/* Esquerda */}
        <div className="flex-1 min-w-0">

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {category && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white"
                style={{ background: isReceita ? 'var(--green)' : 'var(--red)' }}>
                {category.name}
              </span>
            )}
            {!isPaid && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white"
                style={{ background: '#ff8800' }}>
                Pendente
              </span>
            )}
          </div>

          {/* Descrição */}
          <p className="text-base font-bold leading-snug truncate" style={{ color: 'var(--white)' }}>
            {transaction.description || <span style={{ color: 'var(--gray-3)', fontStyle: 'italic', fontWeight: 400 }}>Sem descrição</span>}
          </p>

          {/* Data */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-sm font-bold" style={{ color: textColor }}>
              {formatDate(transaction.date)}
            </span>
            {isPaid && transaction.paidAt && (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--gray-2)' }}>
                  {isReceita ? 'Recebido' : 'Pago'} em {formatDate(transaction.paidAt)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Direita */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="font-mono font-black text-lg leading-none" style={{ color: valueColor }}>
            {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>

          <div className="flex items-center gap-1">
            {!isPaid ? (
              <button
                onClick={onMarkPaid}
                className="p-2 rounded-xl transition-all active:scale-90"
                style={{ background: isReceita ? 'var(--green-dim)' : 'var(--red-dim)', color: valueColor }}
                aria-label={isReceita ? 'Marcar como recebido' : 'Marcar como pago'}
              >
                <CheckCircle2 size={18} />
              </button>
            ) : (
              <button
                onClick={onMarkUnpaid}
                className="p-2 rounded-xl transition-all active:scale-90"
                style={{ background: 'var(--card-2)', color: 'var(--gray-2)' }}
                aria-label="Desfazer"
              >
                <Undo2 size={16} />
              </button>
            )}

            <button onClick={onEdit}
              className="p-2 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
              style={{ color: 'var(--gray-3)' }} aria-label="Editar">
              <Pencil size={15} />
            </button>

            <button onClick={onDelete}
              className="p-2 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
              style={{ color: 'var(--gray-3)' }} aria-label="Excluir">
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
