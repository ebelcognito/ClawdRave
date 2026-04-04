import { useRef, useEffect } from 'react';
import { Shield } from 'lucide-react';
import type { SecurityLogEntry } from '../engine/event-types';

const severityColors = {
  info: 'text-slate-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  success: 'text-emerald-400',
};

const severityDot = {
  info: 'bg-slate-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  success: 'bg-emerald-400',
};

export function SecurityFeed({ entries }: { entries: SecurityLogEntry[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-700/50">
        <Shield size={12} className="text-slate-400" />
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Security Feed
        </span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5 min-h-0">
        {entries.length === 0 && (
          <div className="text-[10px] text-slate-600 italic py-1">No events yet</div>
        )}
        {entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 text-[10px] animate-slide-up">
            <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${severityDot[entry.severity]}`} />
            <span className="text-slate-500 shrink-0">
              {new Date(entry.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <span className={severityColors[entry.severity]}>{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
