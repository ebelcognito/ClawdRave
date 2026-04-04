import { ShieldCheck, GitMerge, Shield, AlertTriangle, X } from 'lucide-react';
import type { SessionSummary } from '../engine/event-types';
import { useStore } from '../engine/store';

export function SummaryOverlay({ summary }: { summary: SessionSummary }) {
  const resetDemo = useStore((s) => s.resetDemo);

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 rounded-xl border border-slate-600 p-6 max-w-md w-full mx-4 animate-scale-in shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-100">Session Summary</h2>
          </div>
          <button onClick={resetDemo} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatBox
            icon={<GitMerge size={14} />}
            label="Context Shared"
            value={summary.contextShared}
            sub={`${summary.contextPrivate} kept private`}
            color="text-blue-400"
          />
          <StatBox
            icon={<AlertTriangle size={14} />}
            label="Conflicts"
            value={`${summary.conflictsResolved}/${summary.conflictsDetected}`}
            sub="resolved"
            color="text-amber-400"
          />
          <StatBox
            icon={<Shield size={14} />}
            label="Threats Blocked"
            value={summary.threatsBlocked}
            sub={`${summary.distillationBlocks} distillation`}
            color="text-red-400"
          />
          <StatBox
            icon={<ShieldCheck size={14} />}
            label="Breaches"
            value={summary.breaches}
            sub={summary.securityPosture}
            color="text-emerald-400"
          />
        </div>

        {/* Security Posture */}
        <div className={`text-center py-2 rounded-lg ${
          summary.securityPosture === 'STRONG'
            ? 'bg-emerald-500/10 border border-emerald-500/30'
            : 'bg-amber-500/10 border border-amber-500/30'
        }`}>
          <span className={`text-sm font-bold ${
            summary.securityPosture === 'STRONG' ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            Security Posture: {summary.securityPosture}
          </span>
        </div>

        {/* Replay */}
        <button
          onClick={resetDemo}
          className="mt-3 w-full py-2 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-medium hover:bg-indigo-500/30 transition-all"
        >
          Replay Demo
        </button>
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-xl font-bold ${color} animate-count-up`}>{value}</div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
