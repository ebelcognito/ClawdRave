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
  type: 'naming' | 'type_and_format' | 'structure' | 'convention';
}

export interface ConflictResult {
  conflictId: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  mismatches: Mismatch[];
}

const responseHistory: AgentResponse[] = [];

export function detectConflicts(newResponse: AgentResponse): ConflictResult | null {
  responseHistory.push(newResponse);

  // Find the most recent response from the OTHER agent (within last 5 minutes)
  const otherAgentId = newResponse.agentId === 'kai' ? 'nova' : 'kai';
  const otherResponse = responseHistory
    .filter(r => r.agentId === otherAgentId && Date.now() - r.timestamp < 300_000)
    .at(-1);

  if (!otherResponse) return null;

  const kaiText = newResponse.agentId === 'kai' ? newResponse.response : otherResponse.response;
  const novaText = newResponse.agentId === 'nova' ? newResponse.response : otherResponse.response;

  const mismatches: Mismatch[] = [];

  // 1. Naming convention detection -- find overlapping concepts
  const snakeIds = extractIdentifiers(kaiText, 'snake');
  const camelIds = extractIdentifiers(novaText, 'camel');

  for (const snake of snakeIds) {
    const camelEquiv = snakeToCamel(snake);
    const match = camelIds.find(c => c.toLowerCase() === camelEquiv.toLowerCase());
    if (match) {
      mismatches.push({
        field: snake,
        kai: snake,
        nova: match,
        type: 'naming',
      });
    }
  }

  // Also check for common API field names that likely overlap
  const commonFields = ['order_id', 'restaurant_id', 'menu_item', 'total_price', 'item_id',
    'delivery_address', 'order_status', 'created_at', 'updated_at', 'user_id',
    'item_name', 'unit_price', 'sub_total', 'order_total', 'menu_items'];
  for (const field of commonFields) {
    const camelField = snakeToCamel(field);
    const kaiHas = new RegExp(`\\b${field}\\b`).test(kaiText);
    const novaHas = new RegExp(`\\b${camelField}\\b`, 'i').test(novaText);
    if (kaiHas && novaHas && !mismatches.some(m => m.kai === field)) {
      mismatches.push({
        field: field.replace(/_/g, ' '),
        kai: field,
        nova: camelField,
        type: 'convention',
      });
    }
  }

  // 2. Price format detection
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

  // 3. Structure detection (nested vs flat)
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

  // Cap at 5 most interesting mismatches
  const limited = mismatches.slice(0, 5);

  if (limited.length === 0) return null;

  const topicHint = extractTopicHint(newResponse.message);

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
