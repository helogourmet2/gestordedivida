import { useState } from 'react';
import { useDebts } from '../hooks/useDebts';
import DebtCard from '../components/DebtCard';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { Filter } from 'lucide-react';

const FILTERS = [
  { id: 'todas', label: 'Todas' },
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'pagas', label: 'Pagas' },
  { id: 'vencidas', label: 'Vencidas' },
];

export default function Dividas() {
  const { allDebts, markAsPaid, markAsUnpaid, deleteDebt } = useDebts();
  const [filter, setFilter] = useState('todas');

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filtered = allDebts.filter((debt) => {
    if (filter === 'pendentes') return !debt.isPaid;
    if (filter === 'pagas') return debt.isPaid;
    if (filter === 'vencidas') return !debt.isPaid && new Date(debt.dueDate) < now;
    return true;
  });

  const totalFiltered = filtered.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header com total */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          {filtered.length} dívida{filtered.length !== 1 ? 's' : ''}
        </h2>
        <span className="text-sm font-mono font-bold text-neutral-700 dark:text-neutral-300">
          {formatCurrency(totalFiltered)}
        </span>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
              filter === f.id
                ? 'bg-red-600 text-white'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onMarkPaid={markAsPaid}
              onMarkUnpaid={markAsUnpaid}
              onDelete={deleteDebt}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            filter === 'todas'
              ? 'Nenhuma dívida cadastrada'
              : filter === 'pendentes'
              ? 'Nenhuma dívida pendente'
              : filter === 'pagas'
              ? 'Nenhuma dívida paga'
              : 'Nenhuma dívida vencida'
          }
          description={
            filter === 'todas'
              ? 'Toque no botão + para registrar sua primeira dívida.'
              : 'Altere o filtro para ver outras dívidas.'
          }
        />
      )}
    </div>
  );
}
