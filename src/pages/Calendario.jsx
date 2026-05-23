import { useDebts } from '../hooks/useDebts';
import CalendarGrid from '../components/CalendarGrid';

export default function Calendario() {
  const { allDebts, markAsPaid } = useDebts();

  return (
    <div>
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4">
        Calendário
      </h2>
      <CalendarGrid debts={allDebts} onMarkPaid={markAsPaid} />
    </div>
  );
}
