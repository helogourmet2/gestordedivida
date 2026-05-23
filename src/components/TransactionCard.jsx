import { CheckCircle2, Undo2, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionCard({ transaction, category, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const isReceita = transaction.type === 'receita';
  const isPaid = transaction.isPaid;

  return (
    <div className={`group rounded-2xl p-4 border transition-all duration-200 ${
      isPaid
        ? 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800'
        : 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">

          {/* Categoria + status */}
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-white ${category.color}`}>
                {category.name}
              </span>
            )}
            {!isPaid && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-500 text-white">
                Pendente
              </span>
            )}
          </div>

          {/* Descrição */}
          {transaction.description ? (
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {transaction.description}
            </p>
          ) : (
            <p className="text-sm text-neutral-400 dark:text-neutral-500 italic truncate">
              Sem descrição
            </p>
          )}

          {/* Data + pago em */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-400 dark:text-neutral-500">
              {formatDate(transaction.date)}
            </span>
            {isPaid && transaction.paidAt && transaction.paidAt !== transaction.date && (
              <>
                <span className="text-neutral-300 dark:text-neutral-700">·</span>
                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                  {isReceita ? 'Recebido' : 'Pago'} em {formatDate(transaction.paidAt)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Valor + ações */}
        <div className="flex flex-col items-end gap-2">
          <span className={`font-mono font-bold text-base ${
            isReceita
              ? 'text-green-600 dark:text-green-400'
              : isPaid
                ? 'text-red-600 dark:text-red-400'
                : 'text-orange-500 dark:text-orange-400'
          }`}>
            {isReceita ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>

          <div className="flex items-center gap-1">
            {/* Pagar/desfazer */}
            {!isPaid ? (
              <button
                onClick={onMarkPaid}
                className="p-2 rounded-xl bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950 transition-colors active:scale-95"
                aria-label={isReceita ? 'Marcar como recebido' : 'Marcar como pago'}
              >
                <CheckCircle2 size={16} />
              </button>
            ) : (
              <button
                onClick={onMarkUnpaid}
                className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors active:scale-95"
                aria-label="Desfazer"
              >
                <Undo2 size={16} />
              </button>
            )}

            {/* Editar */}
            <button
              onClick={onEdit}
              className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Editar"
            >
              <Pencil size={16} />
            </button>

            {/* Excluir */}
            <button
              onClick={onDelete}
              className="p-2 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-colors active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
