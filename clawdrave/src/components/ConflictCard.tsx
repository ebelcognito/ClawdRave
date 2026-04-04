import { AlertTriangle, Check } from 'lucide-react';
import type { Conflict } from '../engine/event-types';

const severityColors = {
  high: 'border-amber-500 bg-amber-500/10',
  medium: 'border-yellow-500 bg-yellow-500/10',
  low: 'border-blue-500 bg-blue-500/10',
};

const severityBadge = {
  high: 'bg-amber-500/20 text-amber-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  low: 'bg-blue-500/20 text-blue-300',
};

export function ConflictCard({ conflict }: { conflict: Conflict }) {
  const isResolved = conflict.status === 'resolved';

  return (
    <div
      className={`rounded-lg border p-3 mb-2 transition-all duration-500 ${
        isResolved
          ? 'border-emerald-500 bg-emerald-500/10'
          : severityColors[conflict.severity]
      } ${conflict.status === 'detected' ? 'animate-shake' : 'animate-scale-in'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isResolved ? (
            <Check size={14} className="text-emerald-400" />
          ) : (
            <AlertTriangle size={14} className="text-amber-400" />
          )}
          <span className="text-xs font-semibold text-slate-200">
            {isResolved ? 'RESOLVED' : 'CONFLICT DETECTED'}
          </span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
          isResolved ? 'bg-emerald-500/20 text-emerald-300' : severityBadge[conflict.severity]
        }`}>
          {conflict.severity.toUpperCase()}
        </span>
      </div>

      <div className="text-xs text-slate-300 font-medium mb-2">{conflict.title}</div>

      {/* Mismatches */}
      {!isResolved && conflict.mismatches.map((m, i) => (
        <div key={i} className="grid grid-cols-2 gap-1 mb-1 text-[10px]">
          <div className="bg-blue-500/10 rounded px-1.5 py-1">
            <span className="text-blue-400 font-medium">Kai: </span>
            <span className="text-slate-300">{m.kai}</span>
          </div>
          <div className="bg-orange-500/10 rounded px-1.5 py-1">
            <span className="text-orange-400 font-medium">Nova: </span>
            <span className="text-slate-300">{m.nova}</span>
          </div>
        </div>
      ))}

      {/* Resolution */}
      {conflict.resolution && (
        <div className="mt-2 text-[10px] text-emerald-300 bg-emerald-500/10 rounded px-2 py-1">
          {conflict.resolution}
        </div>
      )}
    </div>
  );
}
