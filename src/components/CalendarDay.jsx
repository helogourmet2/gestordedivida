export default function CalendarDay({ day, isToday, isSelected, hasDebts, hasUnpaid, hasOverdue, onClick }) {
  if (!day) {
    return <div className="aspect-square" />;
  }

  return (
    <button
      onClick={onClick}
      className={`relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
        isSelected
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
          : isToday
            ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold'
            : hasOverdue
              ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
              : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
      }`}
    >
      {day}
      {/* Indicador de dívida */}
      {hasDebts && !isSelected && (
        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
          hasUnpaid ? 'bg-red-500' : 'bg-neutral-400 dark:bg-neutral-500'
        }`} />
      )}
    </button>
  );
}
