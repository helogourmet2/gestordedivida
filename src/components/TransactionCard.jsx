import { CheckCircle2, Undo2, Trash2, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionCard({ transaction, category, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const isReceita = transaction.type === 'receita';
  const isPaid    = transaction.isPaid;

  // ── Receita: fundo #1a1a1a, barra lateral vermelha, seta ↑ vermelha
  // ── Despesa: fundo vermelho, texto branco, seta ↓ branca
  const cardBg     = isReceita ? '#1a1a1a' : '#e50000';
  const cardBorder = isReceita ? '1px solid #2a2a2a' : 'none';
  const textMain   = '#ffffff';
  const textSub    = isReceita ? '#a0a0a0' : 'rgba(255,255,255,0.75)';
  const valueColor = isReceita ? '#ffffff' : '#ffffff';
  const arrowColor = isReceita ? '#e50000' : '#ffffff';
  const ArrowIcon  = isReceita ? ArrowUp : ArrowDown;

  return (
    <div
      className="group rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: cardBg, border: cardBorder, opacity: isPaid ? 0.75 : 1 }}
    >
      {/* Barra lateral colorida (só receita) */}
      <div className="flex">
        {isReceita && (
          <div className="w-1 shrink-0 rounded-l-2xl" style={{ background: '#e50000' }} />
        )}

        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">

            {/* ── Esquerda ── */}
            <div className="flex-1 min-w-0">

              {/* Seta + categoria + pendente */}
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {/* Seta indicadora */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isReceita ? 'rgba(229,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  <ArrowIcon size={13} style={{ color: arrowColor }} strokeWidth={3} />
                </div>

                {/* Badge categoria */}
                {category && (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide"
                    style={{
                      background: isReceita ? 'rgba(229,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                      color: isReceita ? '#e50000' : '#fff',
                    }}
                  >
                    {category.name}
                  </span>
                )}

                {/* Badge pendente */}
                {!isPaid && (
                  <span
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide"
                    style={{
                      background: isReceita ? '#ff8800' : 'rgba(255,255,255,0.25)',
                      color: '#fff',
                    }}
                  >
                    Pendente
                  </span>
                )}
              </div>

              {/* Descrição */}
              <p className="text-base font-bold leading-snug truncate" style={{ color: textMain }}>
                {transaction.description || (
                  <span style={{ color: textSub, fontStyle: 'italic', fontWeight: 400 }}>
                    Sem descrição
                  </span>
                )}
              </p>

              {/* Data */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-sm font-bold" style={{ color: isReceita ? '#e50000' : 'rgba(255,255,255,0.85)' }}>
                  {formatDate(transaction.date)}
                </span>
                {isPaid && transaction.paidAt && (
                  <>
                    <span style={{ color: isReceita ? '#333' : 'rgba(255,255,255,0.3)' }}>·</span>
                    <span className="text-sm font-semibold" style={{ color: textSub }}>
                      {isReceita ? 'Recebido' : 'Pago'} em {formatDate(transaction.paidAt)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ── Direita ── */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {/* Valor */}
              <span className="font-mono font-black text-lg leading-none" style={{ color: valueColor }}>
                {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
              </span>

              {/* Botões */}
              <div className="flex items-center gap-1">
                {!isPaid ? (
                  <button
                    onClick={onMarkPaid}
                    className="p-2 rounded-xl transition-all active:scale-90"
                    style={{
                      background: isReceita ? 'rgba(229,0,0,0.15)' : 'rgba(255,255,255,0.2)',
                      color: isReceita ? '#e50000' : '#fff',
                    }}
                    aria-label={isReceita ? 'Marcar como recebido' : 'Marcar como pago'}
                  >
                    <CheckCircle2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={onMarkUnpaid}
                    className="p-2 rounded-xl transition-all active:scale-90"
                    style={{
                      background: isReceita ? '#2a2a2a' : 'rgba(255,255,255,0.15)',
                      color: isReceita ? '#a0a0a0' : 'rgba(255,255,255,0.7)',
                    }}
                    aria-label="Desfazer"
                  >
                    <Undo2 size={16} />
                  </button>
                )}

                <button
                  onClick={onEdit}
                  className="p-2 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                  style={{ color: isReceita ? '#444' : 'rgba(255,255,255,0.4)' }}
                  aria-label="Editar"
                >
                  <Pencil size={15} />
                </button>

                <button
                  onClick={onDelete}
                  className="p-2 rounded-xl transition-all active:scale-90 opacity-0 group-hover:opacity-100"
                  style={{ color: isReceita ? '#444' : 'rgba(255,255,255,0.4)' }}
                  aria-label="Excluir"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
