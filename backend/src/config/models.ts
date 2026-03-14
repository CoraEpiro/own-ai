export interface ModelDefinition {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
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
  //  OpenAI
  // ═══════════════════════════════════════════════════════
  {
    id: 'gpt-5.4',
    name: 'GPT-5.4',
    provider: 'OpenAI',
    description: 'Most capable model. Elite coding, reasoning, and 1M context.',
    maxTokens: 128000,
    contextWindow: 1050000,
    costPer1kTokens: { input: 0.0025, output: 0.015 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['vision', 'reasoning'],
    category: 'flagship',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    description: 'Fast and affordable with strong reasoning. Great for everyday tasks.',
    maxTokens: 128000,
    contextWindow: 400000,
    costPer1kTokens: { input: 0.00025, output: 0.002 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['vision', 'reasoning'],
    category: 'fast',
  },
  {
    id: 'gpt-5.3-chat-latest',
    name: 'GPT-5.3 Instant',
    provider: 'OpenAI',
    description: 'Optimized for smooth, everyday conversations.',
    maxTokens: 16384,
    contextWindow: 128000,
    costPer1kTokens: { input: 0.00175, output: 0.014 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['vision'],
    category: 'fast',
  },
  {
    id: 'o3',
    name: 'o3',
    provider: 'OpenAI',
    description: 'Advanced reasoning model. Best for complex analysis and math.',
    maxTokens: 100000,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.01, output: 0.04 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['reasoning', 'vision'],
    category: 'reasoning',
  },
  {
    id: 'o3-mini',
    name: 'o3 Mini',
    provider: 'OpenAI',
    description: 'Lightweight reasoning. Fast and affordable.',
    maxTokens: 100000,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.0011, output: 0.0044 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['reasoning'],
    category: 'reasoning',
  },
  {
    id: 'o4-mini',
    name: 'o4 Mini',
    provider: 'OpenAI',
    description: 'Latest reasoning model. Excellent at coding and analysis.',
    maxTokens: 100000,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.0011, output: 0.0044 },
    isAvailable: true,
    apiKeyEnvVar: 'OPENAI_API_KEY',
    capabilities: ['reasoning', 'vision'],
    category: 'reasoning',
  },

  // ═══════════════════════════════════════════════════════
  //  Anthropic
  // ═══════════════════════════════════════════════════════
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    description: 'Most capable Claude model. Exceptional at complex reasoning and code.',
    maxTokens: 32768,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.015, output: 0.075 },
    isAvailable: true,
    apiKeyEnvVar: 'CLAUDE_API_KEY',
    capabilities: ['vision'],
    category: 'flagship',
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Balanced model. Great at reasoning and code.',
    maxTokens: 8192,
    contextWindow: 200000,
    costPer1kTokens: { input: 0.003, output: 0.015 },
    isAvailable: true,
    apiKeyEnvVar: 'CLAUDE_API_KEY',
    capabilities: ['vision'],
    category: 'flagship',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    description: 'Fast and affordable. Great for quick tasks.',
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
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    description: "Google's most capable model with deep reasoning.",
    maxTokens: 65536,
    contextWindow: 1048576,
    costPer1kTokens: { input: 0.00125, output: 0.01 },
    isAvailable: true,
    apiKeyEnvVar: 'GEMINI_API_KEY',
    capabilities: ['reasoning', 'vision'],
    category: 'flagship',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    description: 'Fast thinking model with built-in reasoning.',
    maxTokens: 65536,
    contextWindow: 1048576,
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    isAvailable: true,
    apiKeyEnvVar: 'GEMINI_API_KEY',
    capabilities: ['reasoning', 'vision'],
    category: 'fast',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: "Google's fast multimodal model with broad capabilities.",
    maxTokens: 8192,
    contextWindow: 1000000,
    costPer1kTokens: { input: 0.0001, output: 0.0004 },
    isAvailable: true,
    apiKeyEnvVar: 'GEMINI_API_KEY',
    capabilities: ['vision'],
    category: 'fast',
  },
];

export function getModelDefinition(modelId: string): ModelDefinition | undefined {
  return MODEL_DEFINITIONS.find(m => m.id === modelId);
}
