import { formatCurrency } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import { TrendingDown, CalendarClock, PieChart } from 'lucide-react';

export default function MetricsBar({ totalPending, monthPending, totalPaid, totalAll }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* Total Pendente */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950 flex items-center justify-center">
            <TrendingDown size={16} className="text-red-600 dark:text-red-400" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Total Pendente</p>
        <p className="text-lg font-bold font-mono text-red-600 dark:text-red-400 mt-0.5">
          {formatCurrency(totalPending)}
        </p>
      </div>

      {/* Vencendo este mês */}
      <div className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <CalendarClock size={16} className="text-neutral-600 dark:text-neutral-400" />
          </div>
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Este Mês</p>
        <p className="text-lg font-bold font-mono text-neutral-900 dark:text-neutral-100 mt-0.5">
          {formatCurrency(monthPending)}
        </p>
      </div>

      {/* Progresso */}
      <div className="col-span-2 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
            <PieChart size={16} className="text-neutral-600 dark:text-neutral-400" />
          </div>
          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Progresso de Pagamento</span>
        </div>
        <ProgressBar value={totalPaid} max={totalAll} label={`${formatCurrency(totalPaid)} de ${formatCurrency(totalAll)} pago`} />
      </div>
    </div>
  );
}
