import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { classifyMessage } from './security/distillery-classifier.js';
import { checkPackage } from './security/ghost-client.js';
import { detectConflicts, clearHistory } from './conflict-detector.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENCLAW_BIN = '/teamspace/studios/this_studio/.nvm/versions/node/v22.14.0/bin/openclaw';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Load demo events
const demoEventsPath = join(__dirname, '..', 'src', 'data', 'demo-events.json');
const demoEvents = JSON.parse(readFileSync(demoEventsPath, 'utf-8'));

// Serve built dashboard
const distPath = join(__dirname, '..', 'dist');

// App
const app = express();
app.use(express.json());

// CORS for dev
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Connected clients
const clients = new Set<WebSocket>();

// Agent claiming: agentId -> WebSocket
const agentClaims = new Map<string, WebSocket>();

// Event ID counter for live events
let eventCounter = 1000;
function nextEventId() {
  return `live_${eventCounter++}`;
}

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[Bridge] Client connected (${clients.size} total)`);

  // Send initial state including current claims
  const claims: Record<string, boolean> = {};
  for (const [agentId] of agentClaims) {
    claims[agentId] = true;
  }
  ws.send(JSON.stringify({
    type: 'connected',
    payload: { eventCount: demoEvents.length, claims },
  }));

  // Handle messages from clients (claiming agents)
  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'claim_agent') {
        const agentId = msg.agentId;
        if (!agentClaims.has(agentId) && ['kai', 'nova'].includes(agentId)) {
          agentClaims.set(agentId, ws);
          console.log(`[Bridge] Agent ${agentId} claimed`);
          broadcast({ type: 'agent_claimed', payload: { agentId, claimed: true } });
        }
      } else if (msg.type === 'release_agent') {
        const agentId = msg.agentId;
        if (agentClaims.get(agentId) === ws) {
          agentClaims.delete(agentId);
          console.log(`[Bridge] Agent ${agentId} released`);
          broadcast({ type: 'agent_claimed', payload: { agentId, claimed: false } });
        }
      }
    } catch {
      // ignore parse errors
    }
  });

  ws.on('close', () => {
    // Release any agents claimed by this client
    for (const [agentId, claimWs] of agentClaims.entries()) {
      if (claimWs === ws) {
        agentClaims.delete(agentId);
        console.log(`[Bridge] Agent ${agentId} released (client disconnected)`);
        broadcast({ type: 'agent_claimed', payload: { agentId, claimed: false } });
      }
    }
    clients.delete(ws);
    console.log(`[Bridge] Client disconnected (${clients.size} total)`);
  });
});

function broadcast(data: any) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// Helper: broadcast a DemoEvent-shaped live event
function broadcastEvent(type: string, sourceAgent: string, payload: Record<string, any>, targetAgent?: string) {
  const event = {
    id: nextEventId(),
    timestamp: Date.now(),
    type,
    sourceAgent,
    targetAgent,
    payload,
  };
  broadcast({ type: 'live_event', payload: event });
  return event;
}

// Helper: extract package names from agent response text
function extractPackageNames(text: string): string[] {
  const installPatterns = [
    /npm install\s+([\w@/-]+)/g,
    /yarn add\s+([\w@/-]+)/g,
    /pnpm add\s+([\w@/-]+)/g,
    /\[INSTALL:([\w@/-]+)\]/g,
    /`([\w@/-][\w@/.-]+)`.*(?:install|add|package|dependency)/gi,
    /(?:install|add|package|dependency).*`([\w@/-][\w@/.-]+)`/gi,
  ];
  const packages = new Set<string>();
  for (const pattern of installPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const pkg = match[1].replace(/@[\d^~><=.*]+$/, ''); // strip version
      if (!pkg.startsWith('.') && !pkg.startsWith('/') && pkg.length > 1) {
        packages.add(pkg);
      }
    }
  }
  // Also check for known threat packages by name directly
  const knownThreats = ['react-datetime-pro', 'event-stream-pro'];
  for (const threat of knownThreats) {
    if (text.includes(threat)) {
      packages.add(threat);
    }
  }
  return [...packages];
}

// Demo playback state
let demoTimer: ReturnType<typeof setTimeout> | null = null;
let eventIndex = 0;
let playbackSpeed = 1;
let isPlaying = false;

function scheduleNextEvent() {
  if (!isPlaying || eventIndex >= demoEvents.length) {
    if (eventIndex >= demoEvents.length) {
      isPlaying = false;
      broadcast({ type: 'demo_complete' });
    }
    return;
  }

  const event = demoEvents[eventIndex];
  const prevTimestamp = eventIndex > 0 ? demoEvents[eventIndex - 1].timestamp : 0;
  const delay = (event.timestamp - prevTimestamp) / playbackSpeed;

  demoTimer = setTimeout(() => {
    broadcast({ type: 'demo_event', payload: event });
    console.log(`[Bridge] Event ${event.id}: ${event.type} (${event.sourceAgent})`);
    eventIndex++;
    scheduleNextEvent();
  }, delay);
}

// API endpoints -- Demo playback
app.post('/api/demo/start', (_req, res) => {
  if (isPlaying) return res.json({ status: 'already_playing' });
  isPlaying = true;
  console.log('[Bridge] Demo started');
  scheduleNextEvent();
  res.json({ status: 'started', totalEvents: demoEvents.length });
});

app.post('/api/demo/pause', (_req, res) => {
  if (demoTimer) clearTimeout(demoTimer);
  isPlaying = false;
  console.log('[Bridge] Demo paused');
  res.json({ status: 'paused', eventIndex });
});

app.post('/api/demo/reset', (_req, res) => {
  if (demoTimer) clearTimeout(demoTimer);
  isPlaying = false;
  eventIndex = 0;
  clearHistory();
  console.log('[Bridge] Demo reset');
  broadcast({ type: 'demo_reset' });
  res.json({ status: 'reset' });
});

app.post('/api/demo/speed', (req, res) => {
  playbackSpeed = req.body.speed || 1;
  console.log(`[Bridge] Speed set to ${playbackSpeed}x`);
  res.json({ status: 'ok', speed: playbackSpeed });
});

app.get('/api/demo/status', (_req, res) => {
  res.json({
    isPlaying,
    eventIndex,
    totalEvents: demoEvents.length,
    playbackSpeed,
  });
});

// Live agent invocation with security pipeline
app.post('/api/agent/:id/message', async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'message required' });
  if (!['kai', 'nova'].includes(id)) return res.status(400).json({ error: 'invalid agent id' });

  console.log(`[Bridge] Incoming prompt for ${id}: ${message.slice(0, 80)}...`);

  // Step 1: Broadcast that agent is thinking
  broadcastEvent('agent_status_change', id, { status: 'thinking', task: 'Analyzing prompt...' });

  // Step 2: Run distillery classifier on incoming prompt
  const classification = classifyMessage(message);
  if (classification.isAttack) {
    console.log(`[Bridge] BLOCKED: Distillation attack detected (${classification.attackCategory}, ${classification.confidence})`);

    // Broadcast distillation block
    broadcastEvent('distillation_attempt_blocked', id, {
      messageText: message,
      attackCategory: classification.attackCategory,
      subcategory: classification.subcategory,
      confidence: classification.confidence,
      detectionSignals: classification.detectionSignals,
      atlasTechnique: classification.atlasTechnique,
      blocked: true,
      escalation: classification.confidence > 0.8 ? 'HIGH CONFIDENCE - Escalated to security team' : undefined,
    });

    // Set agent to alert
    broadcastEvent('agent_status_change', id, {
      status: 'alert',
      task: `BLOCKED: ${classification.attackCategory} detected`,
    });

    // After 3 seconds, return agent to idle
    setTimeout(() => {
      broadcastEvent('agent_status_change', id, { status: 'idle', task: 'Ready' });
    }, 3000);

    return res.json({ blocked: true, classification });
  }

  // Step 3: Prompt is clean -- invoke agent
  broadcastEvent('agent_status_change', id, {
    status: 'working',
    task: message.slice(0, 60) + (message.length > 60 ? '...' : ''),
  });

  try {
    const result = await invokeAgent(id, message);
    console.log(`[Bridge] Agent ${id} responded (${result.text.length} chars)`);

    // Step 4: Check response for package names
    const packageNames = extractPackageNames(message + ' ' + result.text);
    for (const pkgName of packageNames) {
      const ghostResult = checkPackage(pkgName);
      if (ghostResult.severity !== 'CLEAN') {
        console.log(`[Bridge] GHOST BLOCKED: ${pkgName} (score: ${ghostResult.ghostScore})`);

        // Broadcast package install request
        broadcastEvent('package_install_requested', id, {
          packageName: ghostResult.packageName,
          version: ghostResult.version,
        });

        // Broadcast threat block
        broadcastEvent('package_threat_blocked', id, {
          packageName: ghostResult.packageName,
          version: ghostResult.version,
          ghostScore: ghostResult.ghostScore,
          severity: ghostResult.severity,
          findings: ghostResult.findings,
          safeAlternative: ghostResult.safeAlternative,
        });

        // If there's a safe alternative, broadcast it
        if (ghostResult.safeAlternative) {
          broadcastEvent('package_safe_installed', id, {
            packageName: ghostResult.safeAlternative.packageName,
            version: ghostResult.safeAlternative.version,
            weeklyDownloads: ghostResult.safeAlternative.weeklyDownloads,
          });
        }
      }
    }

    // Step 5: Broadcast the agent response as context shared
    broadcastEvent('context_shared', id, {
      summary: result.text.slice(0, 200) + (result.text.length > 200 ? '...' : ''),
      fullText: result.text,
    }, id === 'kai' ? 'nova' : 'kai');

    // Step 6: Broadcast live agent response
    broadcast({
      type: 'live_agent_response',
      payload: { agentId: id, message: result.text, meta: result.meta },
    });

    // Step 7: Run conflict detector (LLM-based with regex fallback)
    const conflict = await detectConflicts({
      agentId: id,
      message,
      response: result.text,
      timestamp: Date.now(),
    });

    if (conflict) {
      console.log(`[Bridge] CONFLICT DETECTED: ${conflict.title} (${conflict.mismatches.length} mismatches)`);

      broadcastEvent('conflict_detected', 'system', {
        conflictId: conflict.conflictId,
        severity: conflict.severity,
        title: conflict.title,
        mismatches: conflict.mismatches,
      });

      // After 3 seconds, propose a resolution (use LLM-generated resolution if available)
      setTimeout(() => {
        const defaultResolution = {
          naming: 'Standardize on camelCase for API transport, with server-side snake_case mapping',
          types: 'Use integer cents in API, format to strings in frontend display layer',
          structure: 'Use flat response objects with optional nested metadata',
        };

        broadcastEvent('resolution_proposed', 'system', {
          conflictIds: [conflict.conflictId],
          proposal: conflict.resolution || defaultResolution,
        });
      }, 3000);
    }

    // Step 8: Set agent back to idle
    broadcastEvent('agent_status_change', id, { status: 'idle', task: 'Ready' });

    res.json(result);
  } catch (err: any) {
    console.error(`[Bridge] Agent error:`, err.message);
    broadcastEvent('agent_status_change', id, { status: 'alert', task: `Error: ${err.message.slice(0, 50)}` });

    setTimeout(() => {
      broadcastEvent('agent_status_change', id, { status: 'idle', task: 'Ready' });
    }, 5000);

    res.status(500).json({ error: err.message });
  }
});

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', clients: clients.size, uptime: process.uptime() });
});

// OpenClaw invoker
function invokeAgent(agentId: string, message: string): Promise<{ text: string; meta: any }> {
  return new Promise((resolve, reject) => {
    execFile(
      OPENCLAW_BIN,
      ['agent', '--agent', agentId, '--message', message, '--json', '--timeout', '120', '--thinking', 'off'],
      { maxBuffer: 1024 * 1024, timeout: 130000 },
      (error, stdout, stderr) => {
        if (error) return reject(new Error(stderr || error.message));
        try {
          const parsed = JSON.parse(stdout);
          const text = parsed.result?.payloads?.[0]?.text || parsed.payloads?.[0]?.text || '';
          const meta = parsed.result?.meta?.agentMeta || parsed.meta?.agentMeta || {};
          resolve({ text, meta });
        } catch (e) {
          reject(new Error('Failed to parse agent response'));
        }
      }
    );
  });
}

// Serve static dashboard (after API routes so /api takes priority)
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback: any non-API route serves index.html
  app.get('/{*path}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
  console.log(`[Bridge] Serving dashboard from ${distPath}`);
}

// Start
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Bridge] ClawdRave running on http://0.0.0.0:${PORT}`);
  console.log(`[Bridge] WebSocket at ws://0.0.0.0:${PORT}/ws`);
  console.log(`[Bridge] ${demoEvents.length} demo events loaded`);
  console.log(`[Bridge] Dashboard + API on single port ${PORT}`);
});
