import { getModelDefinition } from '../config/models';

export interface ModelRecommendation {
  recommendedModel: string;
  alternatives: string[];
  reasoning: string;
  confidence: number; // 0-1
  estimatedCost: number;
  enableDeepSearch?: boolean;
}

interface PromptAnalysis {
  category: string;
  confidence: number;
  keywords: string[];
}

// Heuristic rules for different task types
const HEURISTIC_RULES = {
  reasoning: {
    keywords: ['prove', 'proof', 'derive', 'solve', 'step-by-step', 'reasoning', 'logic', 'theorem', 'hypothesis', 'algorithm', 'math', 'mathematical', 'equation', 'calculate', 'explain the process'],
    model: 'o3',
    confidence: 0.90,
  },
  coding: {
    keywords: ['write code', 'debug', 'refactor', 'function', 'class', 'implement', 'api', 'fix', 'code', 'programming', 'typescript', 'javascript', 'react', 'async', 'promise'],
    model: 'claude-sonnet-4-6',
    confidence: 0.85,
  },
  search: {
    keywords: ['current', 'latest', 'news', 'weather', 'today', 'yesterday', 'price', 'stock', 'who won', 'when is', 'search', 'find out', 'find', 'lookup', 'look up', 'recent', 'live', 'population', 'stats', 'statistics', 'check'],
    model: 'gemini-2.5-flash',
    confidence: 0.90,
  },
  simple: {
    keywords: ['explain', 'summarize', 'translate', 'list', 'format', 'what is', 'how to', 'define', 'tell me', 'describe'],
    model: 'gpt-5-mini',
    confidence: 0.80,
  },
};

function analyzePromptHeuristic(prompt: string, attachments?: any[]): PromptAnalysis {
  const promptLower = prompt.toLowerCase();
  let maxScore = 0;
  let bestCategory = 'simple';
  let matchedKeywords: string[] = [];

  // Check each category
  for (const [category, rules] of Object.entries(HEURISTIC_RULES)) {
    let score = 0;
    const categoryKeywords: string[] = [];

    // Count keyword matches
    for (const keyword of rules.keywords) {
      if (promptLower.includes(keyword.toLowerCase())) {
        score += 1;
        categoryKeywords.push(keyword);
      }
    }

    // Normalize by category specificity
    const normalizedScore = (score / rules.keywords.length) * 100;

    if (normalizedScore > maxScore) {
      maxScore = normalizedScore;
      bestCategory = category;
      matchedKeywords = categoryKeywords;
    }
  }

  // Special detection: vision (has image attachments)
  if (attachments && attachments.length > 0) {
    const hasImage = attachments.some(
      a => a.type?.startsWith('image/') || a.mimeType?.startsWith('image/')
    );
    if (hasImage && maxScore < 0.5) {
      return {
        category: 'vision',
        confidence: 0.85,
        keywords: ['image', 'vision', 'visual'],
      };
    }
  }

  return {
    category: bestCategory,
    confidence: maxScore / 100,
    keywords: matchedKeywords,
  };
}

function getRecommendationForCategory(category: string): { model: string; reasoning: string; confidence: number; alternatives: string[]; enableDeepSearch?: boolean } {
  switch (category) {
    case 'reasoning':
      return {
        model: 'o3',
        reasoning: 'This task requires step-by-step logical reasoning. o3 is specialized for complex mathematical and logical proofs.',
        confidence: 0.90,
        alternatives: ['o4-mini', 'gpt-5.4'],
        enableDeepSearch: false,
      };
    case 'coding':
      return {
        model: 'claude-sonnet-4-6',
        reasoning: 'This is a coding task. Claude Sonnet excels at debugging, refactoring, and implementing complex patterns.',
        confidence: 0.85,
        alternatives: ['gpt-5.4', 'o4-mini'],
        enableDeepSearch: false,
      };
    case 'search':
      return {
        model: 'gemini-2.5-flash',
        reasoning: 'Your query requires real-time information. Gemini 2.5 Flash includes Google Search grounding for up-to-date answers.',
        confidence: 0.90,
        alternatives: ['gpt-5.4'],
        enableDeepSearch: true,
      };
    case 'vision':
      return {
        model: 'gpt-5.4',
        reasoning: 'You have image attachments. GPT-5.4 has excellent vision capabilities and can analyze images while providing code or analysis.',
        confidence: 0.85,
        alternatives: ['claude-sonnet-4-6'],
        enableDeepSearch: false,
      };
    case 'simple':
    default:
      return {
        model: 'gpt-5-mini',
        reasoning: 'This is a straightforward question or explanation task. GPT-5 Mini is fast, accurate, and very cost-effective for simple queries.',
        confidence: 0.80,
        alternatives: ['gemini-2.5-flash', 'claude-haiku-4-5-20251001'],
        enableDeepSearch: false,
      };
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateCost(modelId: string, inputTokens: number, outputTokens: number = 500): number {
  const model = getModelDefinition(modelId);
  if (!model) return 0;

  const inputCost = (inputTokens / 1000) * model.costPer1kTokens.input;
  const outputCost = (outputTokens / 1000) * model.costPer1kTokens.output;

  return inputCost + outputCost;
}

export function recommendModelHeuristic(
  prompt: string,
  attachments?: any[],
  conversationContext?: any[],
  currentModel?: string
): ModelRecommendation {
  const analysis = analyzePromptHeuristic(prompt, attachments);
  let recommendation = getRecommendationForCategory(analysis.category);

  // Cross-provider search logic:
  // If the user is requesting search (category=search), and they are ALREADY using a capable model
  // (like Claude or GPT-5), don't recommend switching to Gemini. 
  // Instead, recommend staying on current model but with Deep Search enabled.
  if (analysis.category === 'search' && currentModel) {
    const modelDef = getModelDefinition(currentModel);
    
    // List of models that we support "proxy search" for (via our webSearchService)
    // Basically any Claude or OpenAI model can use our backend search tool
    const canUseProxySearch = modelDef && (
      modelDef.provider === 'Anthropic' || 
      modelDef.provider === 'OpenAI' ||
      modelDef.id.includes('claude') || 
      modelDef.id.includes('gpt')
    );

    if (canUseProxySearch) {
      recommendation.model = currentModel;
      recommendation.reasoning = `Your query requires real-time information. Enabled Deep Search for ${modelDef?.name || currentModel} to find up-to-date answers using Google Search.`;
      recommendation.enableDeepSearch = true;
      // We keep confidence high because we are confident this is the right APPROACH (using search)
      // even if we are changing the model recommendation to be "stick with current".
    }
  }

  const legacyModelAliases: Record<string, string> = {
    o1: 'o3',
    'o3-mini': 'o4-mini',
    'gpt-4o': 'gpt-5.4',
    'gpt-4o-mini': 'gpt-5-mini',
    'claude-3-5-sonnet-latest': 'claude-sonnet-4-6',
    'claude-3-5-haiku-latest': 'claude-haiku-4-5-20251001',
    'gemini-2.0-flash': 'gemini-2.5-flash',
    'gemini-2.5-pro': 'gemini-2.5-flash',
  };

  recommendation.model = legacyModelAliases[recommendation.model] || recommendation.model;
  if (recommendation.alternatives) {
    recommendation.alternatives = recommendation.alternatives.map(m => legacyModelAliases[m] || m);
  }

  // Calculate tokens
  const inputTokens = estimateTokens(prompt);
  const recommendedCost = estimateCost(recommendation.model, inputTokens, 500);

  return {
    recommendedModel: recommendation.model,
    alternatives: recommendation.alternatives,
    reasoning: recommendation.reasoning,
    confidence: Math.min(analysis.confidence, recommendation.confidence),
    estimatedCost: recommendedCost,
    enableDeepSearch: recommendation.enableDeepSearch,
  };
}

/**
 * Main recommendation function
 * Returns heuristic recommendation if confident enough
 * Falls back to LLM analysis if needed (implemented in Phase 2)
 */
export function recommendModel(
  prompt: string,
  attachments?: any[],
  conversationContext?: any[],
  userPreference?: 'cost' | 'quality' | 'balanced',
  currentModel?: string
): ModelRecommendation {
  // Phase 1: Heuristic analysis
  const recommendation = recommendModelHeuristic(prompt, attachments, conversationContext, currentModel);

  // If confidence is high enough, return immediately
  if (recommendation.confidence > 0.70) {
    return recommendation;
  }

  // If confidence is low, we would call LLM here in Phase 2
  // For now, return heuristic result with lower confidence
  return recommendation;
}
