import { getModelDefinition } from '../config/models';

export interface ModelRecommendation {
  recommendedModel: string;
  alternatives: string[];
  reasoning: string;
  confidence: number; // 0-1
  estimatedCost: number;
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
    model: 'o3-mini',
    confidence: 0.90,
  },
  coding: {
    keywords: ['write code', 'debug', 'refactor', 'function', 'class', 'implement', 'api', 'fix', 'code', 'programming', 'typescript', 'javascript', 'react', 'async', 'promise'],
    model: 'gpt-5.4',
    confidence: 0.85,
  },
  simple: {
    keywords: ['explain', 'summarize', 'translate', 'list', 'format', 'what is', 'how to', 'define', 'tell me', 'describe'],
    model: 'claude-haiku-4-5-20251001',
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

function getRecommendationForCategory(category: string): { model: string; reasoning: string; confidence: number; alternatives: string[] } {
  switch (category) {
    case 'reasoning':
      return {
        model: 'o3-mini',
        reasoning: 'This task requires step-by-step logical reasoning. o3-mini is specialized for complex mathematical and logical proofs.',
        confidence: 0.90,
        alternatives: ['gpt-5.4', 'claude-opus-4-20250514'],
      };
    case 'coding':
      return {
        model: 'gpt-5.4',
        reasoning: 'This is a coding task. GPT-5.4 excels at debugging, refactoring, and implementing complex TypeScript/JavaScript patterns.',
        confidence: 0.85,
        alternatives: ['claude-sonnet-4-20250514', 'gpt-5-mini'],
      };
    case 'vision':
      return {
        model: 'gpt-5.4',
        reasoning: 'You have image attachments. GPT-5.4 has excellent vision capabilities and can analyze images while providing code or analysis.',
        confidence: 0.85,
        alternatives: ['claude-opus-4-20250514'],
      };
    case 'simple':
    default:
      return {
        model: 'claude-haiku-4-5-20251001',
        reasoning: 'This is a straightforward question or explanation task. Claude Haiku is fast, accurate, and very cost-effective for simple queries.',
        confidence: 0.80,
        alternatives: ['gemini-2.0-flash', 'gpt-5-mini'],
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
  conversationContext?: any[]
): ModelRecommendation {
  const analysis = analyzePromptHeuristic(prompt, attachments);
  const recommendation = getRecommendationForCategory(analysis.category);

  // Calculate tokens
  const inputTokens = estimateTokens(prompt);
  const recommendedCost = estimateCost(recommendation.model, inputTokens, 500);

  return {
    recommendedModel: recommendation.model,
    alternatives: recommendation.alternatives,
    reasoning: recommendation.reasoning,
    confidence: Math.min(analysis.confidence, recommendation.confidence),
    estimatedCost: recommendedCost,
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
  userPreference?: 'cost' | 'quality' | 'balanced'
): ModelRecommendation {
  // Phase 1: Heuristic analysis
  const recommendation = recommendModelHeuristic(prompt, attachments, conversationContext);

  // If confidence is high enough, return immediately
  if (recommendation.confidence > 0.70) {
    return recommendation;
  }

  // If confidence is low, we would call LLM here in Phase 2
  // For now, return heuristic result with lower confidence
  return recommendation;
}
