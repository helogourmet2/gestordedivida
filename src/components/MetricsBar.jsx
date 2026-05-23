import { formatCurrency } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import { TrendingDown, CalendarClock, PieChart } from 'lucide-react';

export default function MetricsBar({ totalPending, monthPending, totalPaid, totalAll }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* Total Pendente */}
      <div className="bg-[#0f2040] rounded-2xl p-4 border border-[#1a3366]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-red-900/40 flex items-center justify-center">
            <TrendingDown size={16} className="text-red-400" />
          </div>
        </div>
        <p className="text-[11px] text-[#6b93d6] uppercase tracking-wider font-medium">Total Pendente</p>
        <p className="text-lg font-bold font-mono text-red-400 mt-0.5">
          {formatCurrency(totalPending)}
        </p>
      </div>

      {/* Vencendo este mês */}
      <div className="bg-[#0f2040] rounded-2xl p-4 border border-[#1a3366]">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#152a55] flex items-center justify-center">
            <CalendarClock size={16} className="text-[#b8cef0]" />
          </div>
        </div>
        <p className="text-[11px] text-[#6b93d6] uppercase tracking-wider font-medium">Este Mês</p>
        <p className="text-lg font-bold font-mono text-white mt-0.5">
          {formatCurrency(monthPending)}
        </p>
      </div>

      {/* Progresso */}
      <div className="col-span-2 bg-[#0f2040] rounded-2xl p-4 border border-[#1a3366]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#152a55] flex items-center justify-center">
            <PieChart size={16} className="text-[#b8cef0]" />
          </div>
          <span className="text-[11px] text-[#6b93d6] uppercase tracking-wider font-medium">Progresso de Pagamento</span>
        </div>
        <ProgressBar value={totalPaid} max={totalAll} label={`${formatCurrency(totalPaid)} de ${formatCurrency(totalAll)} pago`} />
      </div>
    </div>
  );
}
