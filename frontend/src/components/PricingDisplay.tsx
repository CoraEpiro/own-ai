import React from 'react';
import { DollarSign, Hash } from 'lucide-react';
import { formatCurrency, formatTokens } from '../utils/pricing';

interface PricingDisplayProps {
  inputTokens: number;
  outputTokens?: number;
  totalTokens?: number;
  inputCost: number;
  outputCost?: number;
  totalCost?: number;
  isEstimate?: boolean;
  showDetails?: boolean;
  variant?: 'user' | 'assistant';
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
  inputTokens,
  outputTokens,
  inputCost,
  outputCost,
  totalCost,
  isEstimate = false,
  variant = 'assistant',
}) => {
  // Show up to 6 decimals for small values, or < $0.0001 for tiny values
  const displayCurrency = (amount: number) => {
    if (amount > 0 && amount < 0.0001) return '< $0.0001';
    if (amount < 0.01) return '$' + amount.toFixed(6);
    return formatCurrency(amount);
  };

  // Style for user message (white badge, dark text)
  const badgeClass =
    variant === 'user'
      ? 'bg-white text-gray-800 border border-gray-200 shadow-sm'
      : 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
  const tokenClass =
    variant === 'user'
      ? 'bg-white text-blue-700 border border-blue-200 shadow-sm'
      : 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';

  // For user: show only input tokens. For assistant: show only output tokens.
  const tokenValue = variant === 'user'
    ? inputTokens
    : (outputTokens ?? 0);

  return (
    <div className="flex items-center space-x-2 text-xs">
      {/* Cost Display */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${badgeClass}`}>
        <DollarSign className="h-3 w-3" />
        <span className="font-medium">
          {isEstimate ? '~' : ''}{displayCurrency(totalCost ?? inputCost + (outputCost ?? 0))}
        </span>
        {isEstimate && <span className="text-green-600 dark:text-green-300">est.</span>}
      </div>

      {/* Token Display */}
      <div className={`flex items-center space-x-1 px-2 py-1 rounded-md ${tokenClass}`}>
        <Hash className="h-3 w-3" />
        <span className="font-medium">{formatTokens(tokenValue)}</span>
        {isEstimate && <span className="text-blue-600 dark:text-blue-300">est.</span>}
      </div>
    </div>
  );
};

export default PricingDisplay; 