import { GitMerge, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useStore } from '../engine/store';

export function StatsBar() {
  const conflicts = useStore((s) => s.conflicts);
  const threats = useStore((s) => s.threats);
  const distillationEvents = useStore((s) => s.distillationEvents);
  const contextShared = useStore((s) => s.contextShared);

  const resolved = conflicts.filter((c) => c.status === 'resolved').length;
  const totalThreats = threats.length + distillationEvents.length;

  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-slate-800/50 border-t border-slate-700/50 text-[10px]">
      <div className="flex items-center gap-4">
        <Stat icon={<GitMerge size={11} />} label="Context Shared" value={contextShared} color="text-blue-400" />
        <Stat
          icon={<ShieldAlert size={11} />}
          label="Conflicts"
          value={`${resolved}/${conflicts.length} resolved`}
          color={resolved === conflicts.length && conflicts.length > 0 ? 'text-emerald-400' : 'text-amber-400'}
        />
        <Stat icon={<Shield size={11} />} label="Threats Blocked" value={totalThreats} color="text-red-400" />
      </div>
      <div className="flex items-center gap-1.5">
        <ShieldCheck size={11} className="text-emerald-400" />
        <span className="text-emerald-400 font-medium">Breaches: 0</span>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <span className="text-slate-500">{label}:</span>
      <span className={`font-medium ${color}`}>{value}</span>
    </div>
  );
}
