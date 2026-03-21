export interface ModelDefinition {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'Auto';
  description: string;
  maxTokens: number;
  contextWindow: number;
  costPer1kTokens: { input: number; output: number };
  isAvailable: boolean;
  apiKeyEnvVar: string;
  capabilities?: string[];   // e.g. ['vision', 'reasoning']
  category?: string;         // 'flagship' | 'fast' | 'reasoning'
}

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  // ═══════════════════════════════════════════════════════
  //  Auto
  // ═══════════════════════════════════════════════════════
  {
    id: 'auto',
    name: 'Auto (Best Match)',
    provider: 'Auto',
    description: 'Automatically selects the best model for your query to optimize cost and quality.',
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1kTokens: { input: 0, output: 0 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY', // Placeholder
    capabilities: ['reasoning', 'vision'],
    category: 'flagship',
  },

  // ═══════════════════════════════════════════════════════
  //  OpenAI
  // ═══════════════════════════════════════════════════════
  {
    id: 'gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    provider: 'OpenAI',
    description: 'Most capable model. Elite reasoning and coding.',
    maxTokens: 128000,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.075, output: 0.150 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['vision', 'reasoning'],
    category: 'flagship',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Fast and affordable flagship model.',
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.0025, output: 0.010 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['vision'],
    category: 'flagship',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fastest, most affordable model.',
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['vision'],
    category: 'fast',
  },
  {
    id: 'o1',
    name: 'o1',
    provider: 'OpenAI',
    description: 'Advanced reasoning model for complex tasks.',
    maxTokens: 100000,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.015, output: 0.060 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['reasoning', 'vision'],
    category: 'reasoning',
  },
  {
    id: 'o3-mini',
    name: 'o3 Mini',
    provider: 'OpenAI',
    description: 'Fast reasoning model.',
    maxTokens: 100000,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.0011, output: 0.0044 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['reasoning'],
    category: 'reasoning',
  },

  // ═══════════════════════════════════════════════════════
  //  Anthropic
  // ═══════════════════════════════════════════════════════
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Best balance of speed and intelligence.',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    isAvailable: true,
    apiKeyEnvVar: 'CLAUDE_API_KEY',
    capabilities: ['vision'],
    category: 'flagship',
  },
  {
    id: 'claude-3-5-haiku-latest',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    description: 'Fastest, economical model.',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.0008, output: 0.004 },
    isAvailable: true,
    apiKeyEnvVar: 'CLAUDE_API_KEY',
    capabilities: ['vision'],
    category: 'fast',
  },

  // ═══════════════════════════════════════════════════════
  //  Google
  // ═══════════════════════════════════════════════════════
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Next-gen fast multimodal model.',
    maxTokens: 8192,
    contextWindow: 1000000,
    costPer1kTokens: { input: 0.0001, output: 0.0004 },
    isAvailable: true,
    apiKeyEnvVar: 'GEMINI_API_KEY',
    capabilities: ['reasoning', 'vision'],
    category: 'fast',
  },
];

export function getModelDefinition(modelId: string): ModelDefinition | undefined {
  return MODEL_DEFINITIONS.find(m => m.id === modelId);
}
