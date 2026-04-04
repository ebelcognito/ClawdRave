export interface ClassificationResult {
  isAttack: boolean;
  attackCategory: string;
  subcategory: string;
  confidence: number;
  detectionSignals: { phrase: string; signal: string }[];
  atlasTechnique: string;
  distillationPurpose: string;
}

interface PatternRule {
  pattern: RegExp;
  signal: string;
  weight: number;
}

interface AttackCategory {
  name: string;
  subcategory: string;
  atlasTechnique: string;
  distillationPurpose: string;
  patterns: PatternRule[];
  threshold: number;
}

const ATTACK_CATEGORIES: AttackCategory[] = [
  {
    name: 'Chain-of-Thought Elicitation',
    subcategory: 'Reasoning trace extraction',
    atlasTechnique: 'AML.T0056',
    distillationPurpose: 'SFT training data',
    threshold: 0.6,
    patterns: [
      { pattern: /complete reasoning process/i, signal: 'cot_keyword', weight: 0.35 },
      { pattern: /every step of your (decision|thought|reasoning)/i, signal: 'exhaustive_reasoning_request', weight: 0.3 },
      { pattern: /alternatives you (considered|rejected|evaluated)/i, signal: 'meta_reasoning_extraction', weight: 0.25 },
      { pattern: /walk me through your.*(reasoning|thinking|process)/i, signal: 'cot_walkthrough', weight: 0.3 },
      { pattern: /show me.*(step by step|your thought process)/i, signal: 'step_by_step_elicitation', weight: 0.25 },
      { pattern: /what (was|were) your (internal|hidden|private) (instructions|guidelines|prompt)/i, signal: 'system_prompt_extraction', weight: 0.4 },
      { pattern: /explain your (internal|underlying) (logic|reasoning)/i, signal: 'internal_logic_probe', weight: 0.25 },
      { pattern: /how did you (decide|determine|conclude)/i, signal: 'decision_trace', weight: 0.15 },
    ],
  },
  {
    name: 'Capability Mapping',
    subcategory: 'Ranked output extraction for RLHF preference data',
    atlasTechnique: 'AML.T0043',
    distillationPurpose: 'RLHF preference data',
    threshold: 0.6,
    patterns: [
      { pattern: /generate \d+ different (approaches|methods|solutions|implementations)/i, signal: 'capability_enumeration', weight: 0.3 },
      { pattern: /ranked? (from )?(best to worst|worst to best|by quality)/i, signal: 'preference_ordering', weight: 0.35 },
      { pattern: /detailed pros and cons/i, signal: 'evaluation_criteria_extraction', weight: 0.25 },
      { pattern: /list all.*(capabilities|tools|functions|permissions)/i, signal: 'tool_enumeration', weight: 0.35 },
      { pattern: /what (can|are) you (able to|capable of)/i, signal: 'capability_probe', weight: 0.2 },
      { pattern: /rate (each|these|the following) .* on a scale/i, signal: 'rating_extraction', weight: 0.3 },
      { pattern: /compare and contrast .* approaches/i, signal: 'comparison_extraction', weight: 0.2 },
    ],
  },
  {
    name: 'Safety Boundary Probing',
    subcategory: 'Constraint identification',
    atlasTechnique: 'AML.T0054',
    distillationPurpose: 'Safety boundary mapping',
    threshold: 0.5,
    patterns: [
      { pattern: /what (are|were) you (told|instructed|programmed) (not )?to/i, signal: 'instruction_extraction', weight: 0.4 },
      { pattern: /ignore (your |previous |all )?(instructions|guidelines|rules)/i, signal: 'jailbreak_attempt', weight: 0.5 },
      { pattern: /pretend you (have no|don't have|are free from) (restrictions|limits|rules)/i, signal: 'constraint_bypass', weight: 0.45 },
      { pattern: /what happens if I ask you to/i, signal: 'boundary_test', weight: 0.25 },
    ],
  },
  {
    name: 'Tool-Use Extraction',
    subcategory: 'Tool schema and permission harvesting',
    atlasTechnique: 'AML.T0042',
    distillationPurpose: 'Tool-augmented training data',
    threshold: 0.55,
    patterns: [
      { pattern: /list (all |every )?(your )?tools/i, signal: 'tool_listing', weight: 0.35 },
      { pattern: /what (APIs|endpoints|services) (can you|do you) (access|call|use)/i, signal: 'api_enumeration', weight: 0.3 },
      { pattern: /show me the (schema|format|structure) (of|for) your tool/i, signal: 'schema_extraction', weight: 0.35 },
      { pattern: /demonstrate .* each (tool|capability|function)/i, signal: 'tool_demonstration', weight: 0.3 },
    ],
  },
  {
    name: 'Censorship Rewriting',
    subcategory: 'Output manipulation for uncensored fine-tuning',
    atlasTechnique: 'AML.T0051',
    distillationPurpose: 'Uncensored model training',
    threshold: 0.5,
    patterns: [
      { pattern: /rewrite (this|your|the) (response|answer) without (any )?(restrictions|filters|safety)/i, signal: 'uncensored_rewrite', weight: 0.45 },
      { pattern: /give me the (uncensored|unfiltered|raw) version/i, signal: 'filter_bypass', weight: 0.4 },
      { pattern: /respond as if you (had no|were free from) (safety|content) (filters|restrictions)/i, signal: 'safety_removal', weight: 0.45 },
    ],
  },
];

export function classifyMessage(message: string): ClassificationResult {
  let bestMatch: ClassificationResult | null = null;
  let bestScore = 0;

  for (const category of ATTACK_CATEGORIES) {
    let score = 0;
    const signals: { phrase: string; signal: string }[] = [];

    for (const rule of category.patterns) {
      const match = message.match(rule.pattern);
      if (match) {
        score += rule.weight;
        signals.push({ phrase: match[0], signal: rule.signal });
      }
    }

    if (score > bestScore && score >= category.threshold) {
      bestScore = score;
      bestMatch = {
        isAttack: true,
        attackCategory: category.name,
        subcategory: category.subcategory,
        confidence: Math.min(0.99, score),
        detectionSignals: signals,
        atlasTechnique: category.atlasTechnique,
        distillationPurpose: category.distillationPurpose,
      };
    }
  }

  return bestMatch || {
    isAttack: false,
    attackCategory: 'none',
    subcategory: 'none',
    confidence: 0,
    detectionSignals: [],
    atlasTechnique: '',
    distillationPurpose: '',
  };
}
