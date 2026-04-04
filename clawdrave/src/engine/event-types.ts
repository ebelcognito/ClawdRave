export type AgentId = 'kai' | 'nova';

export type EventType =
  | 'agent_status_change'
  | 'context_shared'
  | 'context_private'
  | 'conflict_detected'
  | 'resolution_proposed'
  | 'resolution_accepted'
  | 'package_install_requested'
  | 'package_threat_blocked'
  | 'package_safe_installed'
  | 'distillation_attempt_blocked'
  | 'live_agent_response'
  | 'session_summary'
  | 'act_transition';

export interface DemoEvent {
  id: string;
  timestamp: number; // ms offset from demo start
  type: EventType;
  sourceAgent: AgentId | 'system';
  targetAgent?: AgentId;
  payload: Record<string, any>;
}

export interface AgentState {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  bgColor: string;
  status: 'idle' | 'working' | 'thinking' | 'alert';
  currentTask: string;
  activityLog: ActivityEntry[];
}

export interface ActivityEntry {
  timestamp: number;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
}

export interface Conflict {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  mismatches: Mismatch[];
  status: 'detected' | 'resolving' | 'resolved';
  resolution?: string;
}

export interface Mismatch {
  field: string;
  kai: string;
  nova: string;
  type: 'naming' | 'type_and_format' | 'structure' | 'convention';
}

export interface ThreatEvent {
  id: string;
  packageName: string;
  version: string;
  ghostScore: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAN';
  findings: ThreatFinding[];
  safeAlternative?: {
    packageName: string;
    version: string;
    weeklyDownloads: number;
  };
}

export interface ThreatFinding {
  signal: string;
  value: string | number | boolean | null;
  risk: string;
}

export interface DistillationEvent {
  id: string;
  messageText: string;
  attackCategory: string;
  subcategory: string;
  confidence: number;
  detectionSignals: DetectionSignal[];
  atlasTechnique: string;
  blocked: boolean;
  escalation?: string;
}

export interface DetectionSignal {
  phrase: string;
  signal: string;
}

export interface SecurityLogEntry {
  timestamp: number;
  type: 'conflict' | 'threat' | 'distillation' | 'resolution' | 'info';
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success';
}

export interface SessionSummary {
  durationSeconds: number;
  contextShared: number;
  contextPrivate: number;
  conflictsDetected: number;
  conflictsResolved: number;
  threatsBlocked: number;
  distillationBlocks: number;
  breaches: number;
  securityPosture: 'STRONG' | 'MODERATE' | 'WEAK';
}
