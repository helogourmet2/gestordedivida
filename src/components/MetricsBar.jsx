import { formatCurrency } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import { TrendingDown, CalendarClock, PieChart } from 'lucide-react';

export default function MetricsBar({ totalPending, monthPending, totalPaid, totalAll }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">

      {/* Total Pendente */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{ background: 'var(--red-dim)' }}>
          <TrendingDown size={16} style={{ color: 'var(--red)' }} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
          style={{ color: 'var(--gray-2)' }}>Total Pendente</p>
        <p className="text-lg font-black font-mono" style={{ color: 'var(--red)' }}>
          {formatCurrency(totalPending)}
        </p>
      </div>

      {/* Este Mês */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{ background: 'var(--card-2)' }}>
          <CalendarClock size={16} style={{ color: 'var(--gray-2)' }} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5"
          style={{ color: 'var(--gray-2)' }}>Este Mês</p>
        <p className="text-lg font-black font-mono" style={{ color: 'var(--white)' }}>
          {formatCurrency(monthPending)}
        </p>
      </div>

      {/* Progresso */}
      <div className="col-span-2 rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--card-2)' }}>
            <PieChart size={16} style={{ color: 'var(--gray-2)' }} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: 'var(--gray-2)' }}>Progresso de Pagamento</span>
        </div>
        <ProgressBar
          value={totalPaid}
          max={totalAll}
          label={`${formatCurrency(totalPaid)} de ${formatCurrency(totalAll)} pago`}
        />
      </div>
    </div>
  );
}
