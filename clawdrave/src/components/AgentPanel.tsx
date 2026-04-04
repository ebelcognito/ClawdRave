import { useState, useRef } from 'react';
import { User, Code, AlertTriangle, Brain, Send, Lock } from 'lucide-react';
import type { AgentState } from '../engine/event-types';

const statusIcons: Record<string, React.ReactNode> = {
  idle: <User size={14} />,
  working: <Code size={14} />,
  thinking: <Brain size={14} />,
  alert: <AlertTriangle size={14} />,
};

const statusColors: Record<string, string> = {
  idle: 'text-gray-400',
  working: 'text-green-400',
  thinking: 'text-yellow-400',
  alert: 'text-red-400',
};

const logTypeColors: Record<string, string> = {
  info: 'text-slate-300',
  warning: 'text-yellow-300',
  success: 'text-emerald-300',
  error: 'text-red-300',
};

interface AgentPanelProps {
  agent: AgentState;
  side: 'left' | 'right';
  mode: 'scripted' | 'live';
  isMine: boolean;
  isClaimed: boolean;
  onClaim: () => void;
  onSendMessage: (message: string) => void;
}

export function AgentPanel({ agent, side, mode, isMine, isClaimed, onClaim, onSendMessage }: AgentPanelProps) {
  const animClass = side === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isProcessing = agent.status === 'working' || agent.status === 'thinking';

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    onSendMessage(trimmed);
    setInput('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-3">
      {/* Header */}
      <div className={`flex items-center gap-3 ${animClass}`}>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
          style={{ backgroundColor: agent.bgColor, color: agent.color }}
        >
          {agent.name[0]}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm" style={{ color: agent.color }}>
            {agent.name}
          </div>
          <div className="text-xs text-slate-400">{agent.role}</div>
        </div>
        {mode === 'live' && isMine && (
          <div className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
            YOU
          </div>
        )}
      </div>

      {/* Status */}
      <div
        className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-md ${statusColors[agent.status]}`}
        style={{ backgroundColor: `${agent.bgColor}88` }}
      >
        {statusIcons[agent.status]}
        <span className="truncate">{agent.currentTask}</span>
        {isProcessing && (
          <span className="ml-auto flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
            <span className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
          </span>
        )}
      </div>

      {/* Activity Log */}
      <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
        {agent.activityLog.length === 0 && (
          <div className="text-xs text-slate-500 italic p-2">
            {mode === 'live' ? 'Waiting for prompts...' : 'Waiting for demo to start...'}
          </div>
        )}
        {agent.activityLog.map((entry, i) => (
          <div
            key={i}
            className={`text-xs px-2 py-1 rounded ${logTypeColors[entry.type]} animate-slide-up`}
            style={{ backgroundColor: '#1E293B' }}
          >
            <span className="text-slate-500 mr-1">
              {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            {entry.text}
          </div>
        ))}
      </div>

      {/* Live mode input area */}
      {mode === 'live' && (
        <div className="shrink-0 border-t border-slate-700/30 pt-2">
          {!isClaimed ? (
            <button
              onClick={onClaim}
              className="w-full py-2 rounded-md text-xs font-medium transition-all hover:brightness-110"
              style={{ backgroundColor: `${agent.bgColor}`, color: agent.color }}
            >
              Claim {agent.name}
            </button>
          ) : !isMine ? (
            <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-slate-500">
              <Lock size={10} />
              Controlled by teammate
            </div>
          ) : (
            <div className="space-y-1.5">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isProcessing}
                rows={3}
                placeholder={isProcessing ? `${agent.name} is working...` : `Type a prompt for ${agent.name}...`}
                className="w-full bg-slate-800 border border-slate-600 rounded-md px-2 py-1.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isProcessing}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: input.trim() && !isProcessing ? agent.bgColor : '#334155',
                  color: input.trim() && !isProcessing ? agent.color : '#64748B',
                }}
              >
                <Send size={10} />
                {isProcessing ? 'Processing...' : 'Send (Ctrl+Enter)'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
