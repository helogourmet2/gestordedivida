import { useDashboard } from '../hooks/useDashboard';
import { useDebts } from '../hooks/useDebts';
import UrgentDebtBanner from '../components/UrgentDebtBanner';
import MetricsBar from '../components/MetricsBar';
import DebtCard from '../components/DebtCard';
import EmptyState from '../components/EmptyState';

export default function Dashboard() {
  const metrics = useDashboard();
  const { markAsPaid, markAsUnpaid, deleteDebt } = useDebts();

  return (
    <div className="space-y-4">
      {/* Banner da dívida mais urgente */}
      <UrgentDebtBanner
        debt={metrics.urgentDebt}
        onMarkPaid={markAsPaid}
      />

      {/* Métricas */}
      {metrics.totalAll > 0 && (
        <MetricsBar
          totalPending={metrics.totalPending}
          monthPending={metrics.monthPending}
          totalPaid={metrics.totalPaid}
          totalAll={metrics.totalAll}
        />
      )}

      {/* Próximas dívidas */}
      {metrics.upcoming.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
            Próximas Dívidas
          </h2>
          <div className="space-y-2">
            {metrics.upcoming.map(debt => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onMarkPaid={markAsPaid}
                onMarkUnpaid={markAsUnpaid}
                onDelete={deleteDebt}
                compact
              />
            ))}
          </div>
        </div>
      ) : (
        metrics.totalAll === 0 && (
          <EmptyState
            title="Nenhuma dívida cadastrada"
            description="Toque no botão + para registrar sua primeira dívida e começar o controle."
          />
        )
      )}
    </div>
  );
}
