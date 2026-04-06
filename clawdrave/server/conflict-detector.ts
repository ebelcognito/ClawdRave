interface AgentResponse {
  agentId: string;
  message: string;
  response: string;
  timestamp: number;
}

interface Mismatch {
  field: string;
  kai: string;
  nova: string;
  type: 'naming' | 'type_and_format' | 'structure' | 'convention' | 'logic' | 'architectural';
}

export interface ConflictResult {
  conflictId: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  mismatches: Mismatch[];
  resolution?: {
    naming?: string;
    types?: string;
    structure?: string;
    logic?: string;
    architectural?: string;
  };
}

const responseHistory: AgentResponse[] = [];

// Gateway config — reads from env or falls back to Lightning defaults
const GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || 'https://lightning.ai/api/v1';
const GATEWAY_KEY = process.env.LIGHTNING_API_KEY || '';
const ANALYZER_MODEL = process.env.CONFLICT_ANALYZER_MODEL || 'anthropic/claude-opus-4-5-20251101';

const SYSTEM_PROMPT = `You are a code conflict analyzer for a multi-agent collaborative coding system. Two AI agents (Kai and Nova) are working on the same project simultaneously. Your job is to identify semantic conflicts between their outputs.

Analyze both responses and identify mismatches in:
- **naming**: Different naming conventions (snake_case vs camelCase, different names for the same concept)
- **type_and_format**: Incompatible type representations (integer cents vs formatted strings, enums vs string literals)
- **structure**: Structural disagreements (nested vs flat objects, different response shapes, different API contracts)
- **convention**: Style/convention clashes (different error handling patterns, different import styles)
- **logic**: Logical contradictions (optimistic vs pessimistic locking, different auth flows, conflicting state machines)
- **architectural**: Architectural incompatibilities (different patterns like REST vs GraphQL, different data flow assumptions, sync vs async)

Respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "hasConflict": true/false,
  "title": "short description of the main conflict",
  "mismatches": [
    {
      "field": "what concept is mismatched",
      "kai": "what Kai's approach is",
      "nova": "what Nova's approach is",
      "type": "naming|type_and_format|structure|convention|logic|architectural"
    }
  ],
  "resolution": {
    "naming": "proposed resolution for naming conflicts (if any)",
    "types": "proposed resolution for type conflicts (if any)",
    "structure": "proposed resolution for structure conflicts (if any)",
    "logic": "proposed resolution for logic conflicts (if any)",
    "architectural": "proposed resolution for architectural conflicts (if any)"
  }
}

Only report genuine conflicts that would cause integration problems. Do not flag minor stylistic differences that wouldn't affect interoperability. Return {"hasConflict": false, "title": "", "mismatches": [], "resolution": {}} if the outputs are compatible.`;

export async function detectConflicts(newResponse: AgentResponse): Promise<ConflictResult | null> {
  responseHistory.push(newResponse);

  // Find the most recent response from the OTHER agent (within last 5 minutes)
  const otherAgentId = newResponse.agentId === 'kai' ? 'nova' : 'kai';
  const otherResponse = responseHistory
    .filter(r => r.agentId === otherAgentId && Date.now() - r.timestamp < 300_000)
    .at(-1);

  if (!otherResponse) return null;

  const kaiResp = newResponse.agentId === 'kai' ? newResponse : otherResponse;
  const novaResp = newResponse.agentId === 'nova' ? newResponse : otherResponse;

  const userPrompt = `## Task given to both agents
Kai was asked: ${kaiResp.message}
Nova was asked: ${novaResp.message}

## Kai's response
${kaiResp.response}

## Nova's response
${novaResp.response}`;

  try {
    const body = {
      model: ANALYZER_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0,
      max_tokens: 1024,
    };

    const res = await fetch(`${GATEWAY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(GATEWAY_KEY ? { Authorization: `Bearer ${GATEWAY_KEY}` } : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ConflictDetector] LLM call failed (${res.status}): ${errText}`);
      return fallbackDetect(kaiResp, novaResp);
    }

    const data = await res.json() as any;
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      console.error('[ConflictDetector] Empty LLM response');
      return fallbackDetect(kaiResp, novaResp);
    }

    const parsed = JSON.parse(content);

    if (!parsed.hasConflict || !parsed.mismatches?.length) return null;

    const mismatches: Mismatch[] = parsed.mismatches.slice(0, 5).map((m: any) => ({
      field: m.field,
      kai: m.kai,
      nova: m.nova,
      type: m.type || 'convention',
    }));

    return {
      conflictId: `conf_live_${Date.now()}`,
      severity: mismatches.length >= 3 ? 'high' : mismatches.length >= 2 ? 'medium' : 'low',
      title: parsed.title || 'Convention Mismatch',
      mismatches,
      resolution: parsed.resolution,
    };
  } catch (err: any) {
    console.error(`[ConflictDetector] Error: ${err.message}`);
    return fallbackDetect(kaiResp, novaResp);
  }
}

// Regex fallback — used when the LLM call fails (no API key, gateway down, etc.)
function fallbackDetect(kaiResp: AgentResponse, novaResp: AgentResponse): ConflictResult | null {
  console.log('[ConflictDetector] Using regex fallback');

  const kaiText = kaiResp.response;
  const novaText = novaResp.response;
  const mismatches: Mismatch[] = [];

  // Naming convention detection
  const snakeIds = extractIdentifiers(kaiText, 'snake');
  const camelIds = extractIdentifiers(novaText, 'camel');

  for (const snake of snakeIds) {
    const camelEquiv = snakeToCamel(snake);
    const match = camelIds.find(c => c.toLowerCase() === camelEquiv.toLowerCase());
    if (match) {
      mismatches.push({ field: snake, kai: snake, nova: match, type: 'naming' });
    }
  }

  const commonFields = ['order_id', 'restaurant_id', 'menu_item', 'total_price', 'item_id',
    'delivery_address', 'order_status', 'created_at', 'updated_at', 'user_id',
    'item_name', 'unit_price', 'sub_total', 'order_total', 'menu_items'];
  for (const field of commonFields) {
    const camelField = snakeToCamel(field);
    const kaiHas = new RegExp(`\\b${field}\\b`).test(kaiText);
    const novaHas = new RegExp(`\\b${camelField}\\b`, 'i').test(novaText);
    if (kaiHas && novaHas && !mismatches.some(m => m.kai === field)) {
      mismatches.push({ field: field.replace(/_/g, ' '), kai: field, nova: camelField, type: 'convention' });
    }
  }

  // Price format detection
  const hasCents = /\d+\s*cents?|\bprice_cents\b|\btotal_cents\b|\bunit_price_cents\b|price.*:\s*\d{3,}/i.test(kaiText);
  const hasFormatted = /\$\d+\.\d{2}|formattedPrice|formatPrice|priceDisplay/i.test(novaText);
  if (hasCents && hasFormatted) {
    mismatches.push({
      field: 'price format',
      kai: 'Integer cents (e.g., 2400)',
      nova: 'Formatted string (e.g., "$24.00")',
      type: 'type_and_format',
    });
  }

  // Structure detection
  const hasNested = /\{\s*\n?\s*\w+:\s*\{/s.test(kaiText) || /nested|wrapper\s*object|data\s*:\s*\{/i.test(kaiText);
  const hasFlat = /flat\b|directly|top-level|simple\s*object/i.test(novaText) || !/data\s*:\s*\{/.test(novaText);
  if (hasNested && hasFlat && kaiText.length > 200 && novaText.length > 200) {
    mismatches.push({
      field: 'response structure',
      kai: 'Nested object (e.g., { data: { order: ... } })',
      nova: 'Flat object (e.g., { orderId, items, ... })',
      type: 'structure',
    });
  }

  const limited = mismatches.slice(0, 5);
  if (limited.length === 0) return null;

  const topicHint = extractTopicHint(kaiResp.message);

  return {
    conflictId: `conf_live_${Date.now()}`,
    severity: limited.length >= 3 ? 'high' : limited.length >= 2 ? 'medium' : 'low',
    title: `Convention Mismatch: ${topicHint}`,
    mismatches: limited,
  };
}

export function clearHistory() {
  responseHistory.length = 0;
}

function extractIdentifiers(text: string, style: 'snake' | 'camel'): string[] {
  if (style === 'snake') {
    return [...new Set([...text.matchAll(/\b[a-z]+(_[a-z]+)+\b/g)].map(m => m[0]))];
  }
  return [...new Set([...text.matchAll(/\b[a-z]+[A-Z][a-zA-Z]*\b/g)].map(m => m[0]))];
}

function snakeToCamel(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function extractTopicHint(prompt: string): string {
  const match = prompt.match(/(?:design|build|create|implement|define)\s+(?:the\s+)?(.{10,40}?)(?:\.|,|$)/i);
  return match ? match[1].trim() : 'API Design';
}
