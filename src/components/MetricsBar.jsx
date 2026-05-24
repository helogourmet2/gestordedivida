import { formatCurrency } from '../utils/formatters';
import ProgressBar from './ProgressBar';
import { TrendingDown, CalendarClock, PieChart } from 'lucide-react';

export default function MetricsBar({ totalPending, monthPending, totalPaid, totalAll }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">

      {/* Total Pendente */}
      <div className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{ background: 'rgba(229,0,0,0.15)' }}>
          <TrendingDown size={16} style={{ color: '#e50000' }} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider mb-1"
          style={{ color: '#e50000' }}>Total Pendente</p>
        <p className="text-xl font-black font-mono" style={{ color: '#ffffff' }}>
          {formatCurrency(totalPending)}
        </p>
      </div>

      {/* Este Mês */}
      <div className="rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
          style={{ background: '#2a2a2a' }}>
          <CalendarClock size={16} style={{ color: '#a0a0a0' }} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider mb-1"
          style={{ color: '#e50000' }}>Este Mês</p>
        <p className="text-xl font-black font-mono" style={{ color: '#ffffff' }}>
          {formatCurrency(monthPending)}
        </p>
      </div>

      {/* Progresso */}
      <div className="col-span-2 rounded-2xl p-4" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#2a2a2a' }}>
            <PieChart size={16} style={{ color: '#a0a0a0' }} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-wider"
            style={{ color: '#e50000' }}>Progresso de Pagamento</span>
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
