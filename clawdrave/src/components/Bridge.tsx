import { useStore } from '../engine/store';
import { ConflictCard } from './ConflictCard';
import { ThreatCard } from './ThreatCard';
import { DistillationCard } from './DistillationCard';
import { ArrowLeftRight, Wifi } from 'lucide-react';

export function Bridge() {
  const conflicts = useStore((s) => s.conflicts);
  const threats = useStore((s) => s.threats);
  const distillationEvents = useStore((s) => s.distillationEvents);
  const currentAct = useStore((s) => s.currentAct);
  const actTitle = useStore((s) => s.actTitle);
  const contextShared = useStore((s) => s.contextShared);
  const isPlaying = useStore((s) => s.isPlaying);
  const processedEvents = useStore((s) => s.processedEvents);

  // Get recent context shares for animation
  const recentContexts = processedEvents
    .filter((e) => e.type === 'context_shared')
    .slice(-3);

  const hasActiveConflict = conflicts.some((c) => c.status !== 'resolved');
  const hasActiveThreat = threats.length > 0 || distillationEvents.length > 0;

  let borderColor = 'border-slate-700';
  if (hasActiveThreat) borderColor = 'border-red-500/50';
  else if (hasActiveConflict) borderColor = 'border-amber-500/50';
  else if (contextShared > 0) borderColor = 'border-emerald-500/50';

  return (
    <div className={`flex flex-col h-full border-x ${borderColor} transition-colors duration-500`}>
      {/* Bridge Header */}
      <div className="px-3 py-2 border-b border-slate-700/50 bg-slate-800/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">CLAWDRAVE BRIDGE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi
              size={10}
              className={isPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-600'}
            />
            <span className={`text-[10px] ${isPlaying ? 'text-emerald-400' : 'text-slate-600'}`}>
              {isPlaying ? 'LIVE' : 'IDLE'}
            </span>
          </div>
        </div>

        {/* Act indicator */}
        {currentAct > 0 && currentAct < 5 && (
          <div className="mt-1.5 text-[10px] text-center">
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
              Act {currentAct}: {actTitle}
            </span>
          </div>
        )}
      </div>

      {/* Context Flow Visualization */}
      {isPlaying && contextShared > 0 && !hasActiveConflict && !hasActiveThreat && (
        <div className="relative h-8 overflow-hidden border-b border-slate-700/30">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-flow-right" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '1s' }}>
            <div className="w-2 h-2 rounded-full bg-blue-400/60 animate-flow-left" />
          </div>
          <div className="absolute inset-x-0 bottom-0 text-center text-[9px] text-emerald-400/60">
            Context syncing...
          </div>
        </div>
      )}

      {/* Cards Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
        {/* Initial state */}
        {!isPlaying && processedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600">
            <ArrowLeftRight size={24} className="mb-2" />
            <span className="text-xs">Start demo to see bridge activity</span>
          </div>
        )}

        {/* Context shares */}
        {recentContexts.map((e) => (
          <div
            key={e.id}
            className="text-[10px] px-2 py-1.5 rounded bg-slate-800/80 border border-slate-700/50 animate-slide-up"
          >
            <div className="flex items-center gap-1 mb-0.5">
              <span
                className="font-medium"
                style={{ color: e.sourceAgent === 'kai' ? '#3B82F6' : '#F97316' }}
              >
                {e.sourceAgent === 'kai' ? 'Kai' : 'Nova'}
              </span>
              <span className="text-slate-500">→</span>
              <span
                className="font-medium"
                style={{ color: e.targetAgent === 'kai' ? '#3B82F6' : '#F97316' }}
              >
                {e.targetAgent === 'kai' ? 'Kai' : 'Nova'}
              </span>
            </div>
            <span className="text-slate-400">{e.payload.summary}</span>
          </div>
        ))}

        {/* Conflicts */}
        {conflicts.map((c) => (
          <ConflictCard key={c.id} conflict={c} />
        ))}

        {/* Threats */}
        {threats.map((t) => (
          <ThreatCard key={t.id} threat={t} />
        ))}

        {/* Distillation Events */}
        {distillationEvents.map((d) => (
          <DistillationCard key={d.id} event={d} />
        ))}
      </div>
    </div>
  );
}
