import { CheckCircle2, Undo2, Trash2, Pencil } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function TransactionCard({ transaction, category, onEdit, onDelete, onMarkPaid, onMarkUnpaid }) {
  const isReceita = transaction.type === 'receita';
  const isPaid = transaction.isPaid;

  // Cores base por tipo — sempre verde para receita, vermelho para despesa
  const cardBg = isReceita
    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50'
    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/50';

  const valueColor = isReceita
    ? 'text-green-700 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';

  const valuePrefix = isReceita ? '+' : '-';

  return (
    <div className={`group rounded-2xl p-4 border transition-all duration-200 ${cardBg} ${
      !isPaid ? 'opacity-100' : 'opacity-80'
    }`}>
      <div className="flex items-start justify-between gap-3">

        {/* Lado esquerdo — info */}
        <div className="flex-1 min-w-0">

          {/* Linha 1: categoria + pendente */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {category && (
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide text-white ${category.color}`}>
                {category.name}
              </span>
            )}
            {!isPaid && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-orange-500 text-white">
                Pendente
              </span>
            )}
          </div>

          {/* Linha 2: descrição em negrito, fonte maior */}
          <p className={`text-base font-bold leading-snug truncate ${
            isReceita
              ? 'text-green-900 dark:text-green-100'
              : 'text-red-900 dark:text-red-100'
          }`}>
            {transaction.description || 'Sem descrição'}
          </p>

          {/* Linha 3: data em negrito */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-sm font-semibold ${
              isReceita
                ? 'text-green-700 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatDate(transaction.date)}
            </span>
            {isPaid && transaction.paidAt && (
              <>
                <span className="text-neutral-300 dark:text-neutral-600">·</span>
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {isReceita ? 'Recebido' : 'Pago'} em {formatDate(transaction.paidAt)}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Lado direito — valor + ações */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Valor grande e em negrito */}
          <span className={`font-mono font-extrabold text-lg leading-none ${valueColor}`}>
            {valuePrefix}{formatCurrency(transaction.amount)}
          </span>

          {/* Botões de ação */}
          <div className="flex items-center gap-1">
            {/* Pagar/desfazer */}
            {!isPaid ? (
              <button
                onClick={onMarkPaid}
                className={`p-2 rounded-xl transition-colors active:scale-95 ${
                  isReceita
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/70'
                    : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/70'
                }`}
                aria-label={isReceita ? 'Marcar como recebido' : 'Marcar como pago'}
              >
                <CheckCircle2 size={18} />
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

            {/* Editar — aparece no hover */}
            <button
              onClick={onEdit}
              className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Editar"
            >
              <Pencil size={15} />
            </button>

            {/* Excluir — aparece no hover */}
            <button
              onClick={onDelete}
              className="p-2 rounded-xl text-neutral-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600 transition-colors active:scale-95 opacity-0 group-hover:opacity-100"
              aria-label="Excluir"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
