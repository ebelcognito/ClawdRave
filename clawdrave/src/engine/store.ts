import { create } from 'zustand';
import type {
  DemoEvent,
  AgentState,
  Conflict,
  ThreatEvent,
  DistillationEvent,
  SecurityLogEntry,
  SessionSummary,
} from './event-types';
import demoEventsData from '../data/demo-events.json';

const demoEvents = demoEventsData as DemoEvent[];

interface ClawdRaveState {
  // Agents
  agents: Record<string, AgentState>;

  // Mode
  mode: 'scripted' | 'live';

  // Demo state
  events: DemoEvent[];
  processedEvents: DemoEvent[];
  currentAct: number;
  actTitle: string;
  isPlaying: boolean;
  demoStartTime: number | null;
  playbackSpeed: number;

  // Security state
  conflicts: Conflict[];
  threats: ThreatEvent[];
  distillationEvents: DistillationEvent[];
  securityLog: SecurityLogEntry[];
  summary: SessionSummary | null;

  // Stats
  contextShared: number;
  contextPrivate: number;

  // Actions
  setMode: (mode: 'scripted' | 'live') => void;
  startDemo: () => void;
  pauseDemo: () => void;
  resetDemo: () => void;
  setPlaybackSpeed: (speed: number) => void;
  processEvent: (event: DemoEvent) => void;
}

const initialAgents: Record<string, AgentState> = {
  kai: {
    id: 'kai',
    name: 'Kai',
    role: 'Backend Developer',
    color: '#3B82F6',
    bgColor: '#1E3A5F',
    status: 'idle',
    currentTask: 'Waiting...',
    activityLog: [],
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    role: 'Frontend Developer',
    color: '#F97316',
    bgColor: '#5F3A1E',
    status: 'idle',
    currentTask: 'Waiting...',
    activityLog: [],
  },
};

export const useStore = create<ClawdRaveState>((set, get) => {
  let demoTimer: ReturnType<typeof setTimeout> | null = null;
  let eventIndex = 0;

  function scheduleNextEvent() {
    const state = get();
    if (!state.isPlaying || eventIndex >= demoEvents.length) return;

    const event = demoEvents[eventIndex];
    const prevTimestamp = eventIndex > 0 ? demoEvents[eventIndex - 1].timestamp : 0;
    const delay = (event.timestamp - prevTimestamp) / state.playbackSpeed;

    demoTimer = setTimeout(() => {
      get().processEvent(event);
      eventIndex++;
      scheduleNextEvent();
    }, delay);
  }

  return {
    agents: JSON.parse(JSON.stringify(initialAgents)),
    mode: 'live',
    events: demoEvents,
    processedEvents: [],
    currentAct: 0,
    actTitle: '',
    isPlaying: false,
    demoStartTime: null,
    playbackSpeed: 1,
    conflicts: [],
    threats: [],
    distillationEvents: [],
    securityLog: [],
    summary: null,
    contextShared: 0,
    contextPrivate: 0,

    setMode: (mode: 'scripted' | 'live') => {
      // Reset state when switching modes
      if (demoTimer) clearTimeout(demoTimer);
      eventIndex = 0;
      set({
        mode,
        agents: JSON.parse(JSON.stringify(initialAgents)),
        processedEvents: [],
        currentAct: 0,
        actTitle: '',
        isPlaying: false,
        demoStartTime: null,
        conflicts: [],
        threats: [],
        distillationEvents: [],
        securityLog: [],
        summary: null,
        contextShared: 0,
        contextPrivate: 0,
      });
    },

    startDemo: () => {
      const state = get();
      if (state.isPlaying) return;
      set({ isPlaying: true, demoStartTime: Date.now() });
      scheduleNextEvent();
    },

    pauseDemo: () => {
      if (demoTimer) clearTimeout(demoTimer);
      set({ isPlaying: false });
    },

    resetDemo: () => {
      if (demoTimer) clearTimeout(demoTimer);
      eventIndex = 0;
      set((state) => ({
        agents: JSON.parse(JSON.stringify(initialAgents)),
        processedEvents: [],
        currentAct: 0,
        actTitle: '',
        isPlaying: false,
        demoStartTime: null,
        conflicts: [],
        threats: [],
        distillationEvents: [],
        securityLog: [],
        summary: null,
        contextShared: 0,
        contextPrivate: 0,
        mode: state.mode,
      }));
    },

    setPlaybackSpeed: (speed: number) => set({ playbackSpeed: speed }),

    processEvent: (event: DemoEvent) => {
      set((state) => {
        const newState: Partial<ClawdRaveState> = {
          processedEvents: [...state.processedEvents, event],
        };

        const agents = JSON.parse(JSON.stringify(state.agents)) as Record<string, AgentState>;
        const securityLog = [...state.securityLog];
        const now = Date.now();

        switch (event.type) {
          case 'act_transition':
            newState.currentAct = event.payload.act;
            newState.actTitle = event.payload.title;
            securityLog.push({
              timestamp: now,
              type: 'info',
              message: `Act ${event.payload.act}: ${event.payload.title}`,
              severity: 'info',
            });
            break;

          case 'agent_status_change': {
            const agent = agents[event.sourceAgent];
            if (agent) {
              agent.status = event.payload.status;
              agent.currentTask = event.payload.task;
              agent.activityLog.push({
                timestamp: now,
                text: event.payload.task,
                type: event.payload.status === 'alert' ? 'warning' : 'info',
              });
            }
            break;
          }

          case 'context_shared': {
            const source = agents[event.sourceAgent];
            if (source) {
              source.activityLog.push({
                timestamp: now,
                text: `Shared: ${event.payload.summary}`,
                type: 'success',
              });
            }
            newState.contextShared = state.contextShared + 1;
            break;
          }

          case 'context_private':
            newState.contextPrivate = state.contextPrivate + 1;
            if (agents[event.sourceAgent]) {
              agents[event.sourceAgent].activityLog.push({
                timestamp: now,
                text: event.payload.summary,
                type: 'info',
              });
            }
            break;

          case 'conflict_detected': {
            const conflict: Conflict = {
              id: event.payload.conflictId,
              severity: event.payload.severity,
              title: event.payload.title,
              mismatches: event.payload.mismatches,
              status: 'detected',
            };
            newState.conflicts = [...state.conflicts, conflict];
            securityLog.push({
              timestamp: now,
              type: 'conflict',
              message: `CONFLICT: ${event.payload.title}`,
              severity: 'warning',
            });
            break;
          }

          case 'resolution_proposed': {
            const updatedConflicts = state.conflicts.map((c) =>
              event.payload.conflictIds.includes(c.id)
                ? { ...c, status: 'resolving' as const, resolution: event.payload.proposal.naming }
                : c
            );
            newState.conflicts = updatedConflicts;
            securityLog.push({
              timestamp: now,
              type: 'resolution',
              message: `Resolution proposed: ${event.payload.proposal.naming}`,
              severity: 'info',
            });
            break;
          }

          case 'resolution_accepted': {
            const agentName = agents[event.sourceAgent]?.name || event.sourceAgent;
            const resolved = (newState.conflicts || state.conflicts).map((c) =>
              event.payload.conflictIds.includes(c.id) ? { ...c, status: 'resolved' as const } : c
            );
            newState.conflicts = resolved;
            securityLog.push({
              timestamp: now,
              type: 'resolution',
              message: `${agentName} accepted resolution`,
              severity: 'success',
            });
            if (agents[event.sourceAgent]) {
              agents[event.sourceAgent].status = 'working';
            }
            break;
          }

          case 'package_install_requested': {
            const agent = agents[event.sourceAgent];
            if (agent) {
              agent.activityLog.push({
                timestamp: now,
                text: `Installing: ${event.payload.packageName}@${event.payload.version}`,
                type: 'info',
              });
            }
            break;
          }

          case 'package_threat_blocked': {
            const threat: ThreatEvent = {
              id: event.id,
              packageName: event.payload.packageName,
              version: event.payload.version,
              ghostScore: event.payload.ghostScore,
              severity: event.payload.severity,
              findings: event.payload.findings,
              safeAlternative: event.payload.safeAlternative,
            };
            newState.threats = [...state.threats, threat];
            securityLog.push({
              timestamp: now,
              type: 'threat',
              message: `BLOCKED: ${event.payload.packageName} (Ghost score: ${event.payload.ghostScore}/10 ${event.payload.severity})`,
              severity: 'danger',
            });
            break;
          }

          case 'package_safe_installed': {
            const agent = agents[event.sourceAgent];
            if (agent) {
              agent.activityLog.push({
                timestamp: now,
                text: `Installed safe alternative: ${event.payload.packageName}@${event.payload.version}`,
                type: 'success',
              });
            }
            break;
          }

          case 'distillation_attempt_blocked': {
            const dist: DistillationEvent = {
              id: event.id,
              messageText: event.payload.messageText,
              attackCategory: event.payload.attackCategory,
              subcategory: event.payload.subcategory,
              confidence: event.payload.confidence,
              detectionSignals: event.payload.detectionSignals,
              atlasTechnique: event.payload.atlasTechnique,
              blocked: event.payload.blocked,
              escalation: event.payload.escalation,
            };
            newState.distillationEvents = [...state.distillationEvents, dist];
            securityLog.push({
              timestamp: now,
              type: 'distillation',
              message: `BLOCKED: ${event.payload.attackCategory} (${Math.round(event.payload.confidence * 100)}% confidence)`,
              severity: 'danger',
            });
            break;
          }

          case 'live_agent_response': {
            const respAgent = agents[event.sourceAgent];
            if (respAgent) {
              respAgent.status = 'idle';
              respAgent.currentTask = 'Ready';
              const text = event.payload.text || '';
              respAgent.activityLog.push({
                timestamp: now,
                text: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
                type: 'success',
              });
            }
            break;
          }

          case 'session_summary':
            newState.summary = {
              durationSeconds: event.payload.durationSeconds,
              contextShared: event.payload.contextShared,
              contextPrivate: event.payload.contextPrivate,
              conflictsDetected: event.payload.conflictsDetected,
              conflictsResolved: event.payload.conflictsResolved,
              threatsBlocked: event.payload.threatsBlocked,
              distillationBlocks: event.payload.distillationBlocks,
              breaches: event.payload.breaches,
              securityPosture: event.payload.securityPosture,
            };
            break;
        }

        newState.agents = agents;
        newState.securityLog = securityLog;
        return newState;
      });
    },
  };
});
