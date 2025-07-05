import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { LLMModel } from '../types';
import { formatCurrency } from '../utils/pricing';

interface PricingExplanationProps {
  model: LLMModel;
  inputTokens: number;
  estimatedOutputTokens: number;
  inputCost: number;
  estimatedOutputCost: number;
  totalCost: number;
}

const PricingExplanation: React.FC<PricingExplanationProps> = ({
  model,
  inputTokens,
  estimatedOutputTokens,
  inputCost,
  estimatedOutputCost,
  totalCost
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!model || !model.costPer1kTokens) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
            How is this cost calculated?
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="mt-3 space-y-2 text-xs text-blue-700 dark:text-blue-300">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Model:</strong> {model.name}
            </div>
            <div>
              <strong>Provider:</strong> {model.provider}
            </div>
          </div>
          
          <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
            <div className="font-medium mb-1">Input Tokens ({inputTokens}):</div>
            <div className="ml-2">
              • Rate: {formatCurrency(model.costPer1kTokens.input)} per 1k tokens<br/>
              • Cost: {formatCurrency(inputCost)}
            </div>
          </div>
          
          <div className="border-t border-blue-200 dark:border-blue-700 pt-2">
            <div className="font-medium mb-1">Estimated Output Tokens ({estimatedOutputTokens}):</div>
            <div className="ml-2">
              • Rate: {formatCurrency(model.costPer1kTokens.output)} per 1k tokens<br/>
              • Cost: {formatCurrency(estimatedOutputCost)}
            </div>
          </div>
          
          <div className="border-t border-blue-200 dark:border-blue-700 pt-2 font-medium">
            Total Estimated Cost: {formatCurrency(totalCost)}
          </div>
          
          <div className="text-xs opacity-75 mt-2">
            💡 Token estimation: ~4 characters per token. Actual costs may vary based on AI response length.
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingExplanation; 