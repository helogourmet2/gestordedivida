import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WEEKDAYS, MONTHS } from '../utils/constants';
import CalendarDay from './CalendarDay';
import DayDetail from './DayDetail';

export default function CalendarGrid({ debts, onMarkPaid }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Gerar dias do mês
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Dias vazios antes do primeiro dia
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: null });
    }

    // Dias do mês
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({ day: d, date });
    }

    return days;
  }, [year, month]);

  // Mapa de dívidas por dia
  const debtsByDay = useMemo(() => {
    const map = {};
    if (!debts) return map;
    
    debts.forEach(debt => {
      const dueDate = new Date(debt.dueDate);
      if (dueDate.getMonth() === month && dueDate.getFullYear() === year) {
        const day = dueDate.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(debt);
      }
    });
    return map;
  }, [debts, month, year]);

  // Dívidas do dia selecionado
  const selectedDayDebts = selectedDate ? (debtsByDay[selectedDate] || []) : [];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const today = new Date();
  const isToday = (day) => {
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  return (
    <div>
      {/* Header do calendário */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-bold">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((item, idx) => (
          <CalendarDay
            key={idx}
            day={item.day}
            isToday={item.day && isToday(item.day)}
            isSelected={item.day === selectedDate}
            hasDebts={item.day && debtsByDay[item.day]?.length > 0}
            hasUnpaid={item.day && debtsByDay[item.day]?.some(d => !d.isPaid)}
            hasOverdue={item.day && debtsByDay[item.day]?.some(d => !d.isPaid && new Date(d.dueDate) < new Date(today.toDateString()))}
            onClick={() => item.day && setSelectedDate(item.day === selectedDate ? null : item.day)}
          />
        ))}
      </div>

      {/* Detalhe do dia selecionado */}
      {selectedDate && (
        <DayDetail
          date={new Date(year, month, selectedDate)}
          debts={selectedDayDebts}
          onMarkPaid={onMarkPaid}
        />
      )}
    </div>
  );
}
