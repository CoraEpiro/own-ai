import { LLMModel } from '../types';

// Rough token estimation (1 token ≈ 4 characters for English text)
export const estimateTokens = (text: string): number => {
  return Math.ceil(text.length / 4);
};

// Calculate cost for input tokens
export const calculateInputCost = (tokens: number, model: LLMModel): number => {
  return (tokens / 1000) * model.costPer1kTokens.input;
};

// Calculate cost for output tokens (estimated response)
export const calculateOutputCost = (tokens: number, model: LLMModel): number => {
  return (tokens / 1000) * model.costPer1kTokens.output;
};

// Calculate total estimated cost for a conversation
export const calculateTotalCost = (
  inputTokens: number, 
  estimatedOutputTokens: number, 
  model: LLMModel
): number => {
  const inputCost = calculateInputCost(inputTokens, model);
  const outputCost = calculateOutputCost(estimatedOutputTokens, model);
  return inputCost + outputCost;
};

// Estimate output tokens based on input (rough heuristic)
export const estimateOutputTokens = (inputTokens: number): number => {
  // Assume response is roughly 1.5x the input length
  return Math.ceil(inputTokens * 1.5);
};

// Format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4
  }).format(amount);
};

// Format token count
export const formatTokens = (tokens: number): string => {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}; 