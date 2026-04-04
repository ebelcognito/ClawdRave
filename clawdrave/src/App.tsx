import { useStore } from './engine/store';
import { useWebSocket } from './hooks/useWebSocket';
import { AgentPanel } from './components/AgentPanel';
import { Bridge } from './components/Bridge';
import { SecurityFeed } from './components/SecurityFeed';
import { StatsBar } from './components/StatsBar';
import { DemoControls } from './components/DemoControls';
import { SummaryOverlay } from './components/SummaryOverlay';
import { Cog } from 'lucide-react';

function App() {
  const agents = useStore((s) => s.agents);
  const mode = useStore((s) => s.mode);
  const securityLog = useStore((s) => s.securityLog);
  const summary = useStore((s) => s.summary);

  const { connected, claimedAgent, agentClaims, claimAgent } = useWebSocket();

  async function handleSendMessage(agentId: string, message: string) {
    try {
      await fetch(`/api/agent/${agentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#0F172A] text-slate-100 relative">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Cog size={14} className="text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-wide">
            <span className="text-indigo-400">CLAWD</span>
            <span className="text-purple-400">RAVE</span>
          </h1>
          <span className="text-[10px] text-slate-500 ml-1">Mission Control</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          {mode === 'live' && (
            <span className={`px-1.5 py-0.5 rounded border ${
              connected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          )}
          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
            OpenClaw + Validia
          </span>
        </div>
      </header>

      {/* Main Content: 3-column layout */}
      <div className="flex-1 grid grid-cols-[1fr_1.2fr_1fr] min-h-0">
        {/* Kai Panel */}
        <div className="border-r border-slate-700/30 overflow-hidden">
          <AgentPanel
            agent={agents.kai}
            side="left"
            mode={mode}
            isMine={claimedAgent === 'kai'}
            isClaimed={!!agentClaims.kai}
            onClaim={() => claimAgent('kai')}
            onSendMessage={(msg) => handleSendMessage('kai', msg)}
          />
        </div>

        {/* Bridge */}
        <div className="overflow-hidden">
          <Bridge />
        </div>

        {/* Nova Panel */}
        <div className="border-l border-slate-700/30 overflow-hidden">
          <AgentPanel
            agent={agents.nova}
            side="right"
            mode={mode}
            isMine={claimedAgent === 'nova'}
            isClaimed={!!agentClaims.nova}
            onClaim={() => claimAgent('nova')}
            onSendMessage={(msg) => handleSendMessage('nova', msg)}
          />
        </div>
      </div>

      {/* Security Feed */}
      <div className="h-24 border-t border-slate-700/50 bg-slate-900/50 shrink-0">
        <SecurityFeed entries={securityLog} />
      </div>

      {/* Stats Bar */}
      <StatsBar />

      {/* Demo Controls */}
      <DemoControls connected={connected} />

      {/* Summary Overlay */}
      {summary && <SummaryOverlay summary={summary} />}
    </div>
  );
}

export default App;
