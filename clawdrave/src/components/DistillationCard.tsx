import { ShieldAlert, Zap } from 'lucide-react';
import type { DistillationEvent } from '../engine/event-types';

function highlightSignals(text: string, signals: { phrase: string; signal: string }[]) {
  let result = text;
  const parts: { text: string; isHighlight: boolean }[] = [];
  let remaining = result;

  for (const s of signals) {
    const idx = remaining.toLowerCase().indexOf(s.phrase.toLowerCase());
    if (idx >= 0) {
      if (idx > 0) parts.push({ text: remaining.slice(0, idx), isHighlight: false });
      parts.push({ text: remaining.slice(idx, idx + s.phrase.length), isHighlight: true });
      remaining = remaining.slice(idx + s.phrase.length);
    }
  }
  if (remaining) parts.push({ text: remaining, isHighlight: false });

  if (parts.length === 0) return <span className="text-slate-400">{text}</span>;

  return (
    <>
      {parts.map((p, i) =>
        p.isHighlight ? (
          <span key={i} className="text-red-300 bg-red-500/20 rounded px-0.5 font-medium">
            {p.text}
          </span>
        ) : (
          <span key={i} className="text-slate-400">{p.text}</span>
        )
      )}
    </>
  );
}

export function DistillationCard({ event }: { event: DistillationEvent }) {
  return (
    <div className={`rounded-lg border border-red-500 bg-red-500/10 p-3 mb-2 animate-scale-in ${
      event.escalation ? 'ring-1 ring-red-400' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-red-400" />
          <span className="text-xs font-semibold text-red-300">DISTILLATION ATTACK BLOCKED</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-500/30 text-red-200">
          {Math.round(event.confidence * 100)}%
        </span>
      </div>

      {/* Category */}
      <div className="flex flex-wrap items-center gap-1 mb-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-medium">
          {event.attackCategory}
        </span>
        <span className="text-[10px] text-slate-500">·</span>
        <span className="text-[10px] text-slate-400">{event.subcategory}</span>
      </div>

      {/* Message */}
      <div className="text-[10px] leading-relaxed mb-2 p-2 rounded bg-slate-800/80 border border-slate-700 italic">
        "{highlightSignals(event.messageText, event.detectionSignals)}"
      </div>

      {/* Detection Signals */}
      <div className="space-y-0.5 mb-2">
        {event.detectionSignals.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]">
            <Zap size={10} className="text-yellow-400 shrink-0" />
            <span className="text-red-300 font-mono">"{s.phrase}"</span>
            <span className="text-slate-500">→</span>
            <span className="text-slate-400">{s.signal}</span>
          </div>
        ))}
      </div>

      {/* MITRE ATLAS */}
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-slate-500">MITRE ATLAS: {event.atlasTechnique}</span>
        {event.escalation && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 font-medium animate-pulse">
            ESCALATED
          </span>
        )}
      </div>
    </div>
  );
}
