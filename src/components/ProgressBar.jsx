export default function ProgressBar({ value, max, label }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{label}</span>
          <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-red-600 dark:bg-red-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
