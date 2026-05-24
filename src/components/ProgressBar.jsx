export default function ProgressBar({ value, max, label }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium" style={{ color: 'var(--gray-2)' }}>{label}</span>
          <span className="text-xs font-black font-mono" style={{ color: 'var(--white)' }}>
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
      <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--card-2)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${percentage}%`, background: 'var(--red)' }}
        />
      </div>
    </div>
  );
}
