import { useEffect, useRef, useState, useCallback } from 'react';
import { useStore } from '../engine/store';
import type { AgentId } from '../engine/event-types';

interface UseWebSocketReturn {
  connected: boolean;
  claimedAgent: AgentId | null;
  agentClaims: Record<string, boolean>;
  claimAgent: (agentId: AgentId) => void;
  releaseAgent: (agentId: AgentId) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const [connected, setConnected] = useState(false);
  const [claimedAgent, setClaimedAgent] = useState<AgentId | null>(null);
  const [agentClaims, setAgentClaims] = useState<Record<string, boolean>>({});

  useEffect(() => {
    function connect() {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected');
        setConnected(true);
        reconnectCount.current = 0;

        // Re-claim agent if we had one before reconnect
        const stored = sessionStorage.getItem('clawdrave_claimed_agent');
        if (stored && ['kai', 'nova'].includes(stored)) {
          ws.send(JSON.stringify({ type: 'claim_agent', agentId: stored }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const store = useStore.getState();

          switch (msg.type) {
            case 'connected':
              // Initial state with current claims
              if (msg.payload.claims) {
                setAgentClaims(msg.payload.claims);
              }
              break;

            case 'demo_event':
              // Scripted demo event from server
              store.processEvent(msg.payload);
              break;

            case 'live_event':
              // Live event from server security pipeline
              store.processEvent(msg.payload);
              break;

            case 'live_agent_response':
              // Agent response -- update activity log
              store.processEvent({
                id: `live_resp_${Date.now()}`,
                timestamp: Date.now(),
                type: 'live_agent_response',
                sourceAgent: msg.payload.agentId,
                payload: {
                  text: msg.payload.message,
                  meta: msg.payload.meta,
                },
              });
              break;

            case 'agent_claimed':
              setAgentClaims((prev) => ({
                ...prev,
                [msg.payload.agentId]: msg.payload.claimed,
              }));
              break;

            case 'demo_reset':
              store.resetDemo();
              break;

            case 'demo_complete':
              // Handled by store via event
              break;
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setConnected(false);
        wsRef.current = null;

        // Reconnect with backoff (max 10 retries)
        if (reconnectCount.current < 10) {
          reconnectCount.current++;
          const delay = Math.min(2000 * reconnectCount.current, 10000);
          setTimeout(connect, delay);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };
    }

    connect();

    return () => {
      if (wsRef.current) {
        reconnectCount.current = 999; // prevent reconnect on cleanup
        wsRef.current.close();
      }
    };
  }, []);

  const claimAgent = useCallback((agentId: AgentId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'claim_agent', agentId }));
      setClaimedAgent(agentId);
      sessionStorage.setItem('clawdrave_claimed_agent', agentId);
    }
  }, []);

  const releaseAgent = useCallback((agentId: AgentId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'release_agent', agentId }));
      setClaimedAgent(null);
      sessionStorage.removeItem('clawdrave_claimed_agent');
    }
  }, []);

  return { connected, claimedAgent, agentClaims, claimAgent, releaseAgent };
}
