import { Play, Pause, RotateCcw, Zap, Radio, Film } from 'lucide-react';
import { useStore } from '../engine/store';

interface DemoControlsProps {
  connected?: boolean;
}

export function DemoControls({ connected }: DemoControlsProps) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const isPlaying = useStore((s) => s.isPlaying);
  const startDemo = useStore((s) => s.startDemo);
  const pauseDemo = useStore((s) => s.pauseDemo);
  const resetDemo = useStore((s) => s.resetDemo);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const setPlaybackSpeed = useStore((s) => s.setPlaybackSpeed);
  const summary = useStore((s) => s.summary);

  const speeds = [0.5, 1, 1.5, 2, 3];

  return (
    <div className="flex items-center justify-center gap-3 px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
      {/* Mode Toggle */}
      <div className="flex items-center bg-slate-900 rounded-md border border-slate-700 overflow-hidden">
        <button
          onClick={() => setMode('scripted')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
            mode === 'scripted' ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Film size={10} />
          Scripted
        </button>
        <button
          onClick={() => setMode('live')}
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium transition-all ${
            mode === 'live' ? 'bg-emerald-500/30 text-emerald-300' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Radio size={10} />
          Live
        </button>
      </div>

      {mode === 'scripted' ? (
        <>
          {/* Play/Pause */}
          <button
            onClick={isPlaying ? pauseDemo : startDemo}
            disabled={summary !== null}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              summary !== null
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : isPlaying
                ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
            }`}
          >
            {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            {summary !== null ? 'Complete' : isPlaying ? 'Pause' : 'Run Demo'}
          </button>

          {/* Reset */}
          <button
            onClick={resetDemo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>

          {/* Speed */}
          <div className="flex items-center gap-1.5 ml-2">
            <Zap size={10} className="text-slate-500" />
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all ${
                  playbackSpeed === s
                    ? 'bg-indigo-500/30 text-indigo-300'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Connection indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={connected ? 'text-emerald-300' : 'text-red-300'}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Reset */}
          <button
            onClick={resetDemo}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-all"
          >
            <RotateCcw size={12} />
            Reset
          </button>

          <span className="text-[10px] text-slate-500">
            Type prompts in agent panels
          </span>
        </>
      )}
    </div>
  );
}
