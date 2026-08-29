import { useEffect, useState } from 'react';

interface Props {
  /** ISO end timestamp; the timer counts down to this. */
  endsAt: string;
  /** Fired once when the countdown reaches zero. */
  onExpire?: () => void;
  className?: string;
}

function diffParts(target: number) {
  const total = Math.max(0, target - Date.now());
  const totalSeconds = Math.floor(total / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { total, days, hours, minutes, seconds };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Presentational HH:MM:SS countdown for a flash-sale deal. */
export function CountdownTimer({ endsAt, onExpire, className = '' }: Props) {
  const target = new Date(endsAt).getTime();
  const [parts, setParts] = useState(() => diffParts(target));

  useEffect(() => {
    // Tick every second; the first tick also re-syncs after an endsAt change.
    const timer = setInterval(() => {
      const next = diffParts(new Date(endsAt).getTime());
      setParts(next);
      if (next.total <= 0) {
        clearInterval(timer);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt]);

  // Only surface a days pill for long-running deals — short deals stay HH:MM:SS.
  const segments = parts.days > 0
    ? [parts.days, parts.hours, parts.minutes, parts.seconds]
    : [parts.hours, parts.minutes, parts.seconds];

  return (
    <div className={`flex items-center gap-1 ${className}`} aria-label="Time remaining">
      {segments.map((value, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-amber-600 dark:text-amber-400">:</span>}
          <span className="min-w-[1.75rem] rounded-md bg-amber-600 px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-white dark:bg-amber-500">
            {pad(value)}
          </span>
        </span>
      ))}
    </div>
  );
}
