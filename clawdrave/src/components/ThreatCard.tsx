import { Shield, Package, CheckCircle } from 'lucide-react';
import type { ThreatEvent } from '../engine/event-types';

const signalIcons: Record<string, string> = {
  weekly_downloads: '📊',
  github_repo: '📂',
  install_script: '⚡',
  network_calls: '🌐',
  obfuscation: '🔒',
  maintainer_change: '👤',
  typosquat: '🎭',
};

export function ThreatCard({ threat }: { threat: ThreatEvent }) {
  return (
    <div className="rounded-lg border border-red-500 bg-red-500/10 p-3 mb-2 animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-red-400" />
          <span className="text-xs font-semibold text-red-300">SUPPLY CHAIN THREAT BLOCKED</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-red-500/30 text-red-200">
          {threat.ghostScore}/10 {threat.severity}
        </span>
      </div>

      {/* Package Info */}
      <div className="flex items-center gap-2 mb-2 text-xs">
        <Package size={12} className="text-slate-400" />
        <span className="text-slate-300 font-mono">
          {threat.packageName}@{threat.version}
        </span>
      </div>

      {/* Findings */}
      <div className="space-y-1 mb-2">
        {threat.findings.map((f, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px]">
            <span>{signalIcons[f.signal] || '⚠️'}</span>
            <div>
              <span className="text-red-300 font-medium">{f.signal}: </span>
              <span className="text-slate-400">{f.risk}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Safe Alternative */}
      {threat.safeAlternative && (
        <div className="flex items-center gap-2 text-[10px] bg-emerald-500/10 rounded px-2 py-1.5 border border-emerald-500/30">
          <CheckCircle size={12} className="text-emerald-400 shrink-0" />
          <span className="text-emerald-300">
            Use <span className="font-mono font-medium">{threat.safeAlternative.packageName}@{threat.safeAlternative.version}</span>
            {' '}({(threat.safeAlternative.weeklyDownloads / 1000000).toFixed(1)}M weekly downloads)
          </span>
        </div>
      )}
    </div>
  );
}
