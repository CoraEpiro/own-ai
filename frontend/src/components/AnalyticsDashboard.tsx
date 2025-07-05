import React, { useState, useEffect } from 'react';
import DashboardCharts from './DashboardCharts';
import AnimatedNumber from './AnimatedNumber';
import { getApiUrl } from '../config/api';

interface DashboardData {
  totalUsage: {
    tokens: number;
    cost: number;
    messages: number;
  };
  modelBreakdown: Array<{
    model: string;
    provider: string;
    tokens: number;
    cost: number;
    messages: number;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
  }>;
  dailyUsage: Array<{
    date: string;
    tokens: number;
    cost: number;
    messages: number;
  }>;
  providerBreakdown: Array<{
    provider: string;
    tokens: number;
    cost: number;
    messages: number;
  }>;
}

interface Filters {
  models: string[];
  providers: string[];
}

const AnalyticsDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [availableFilters, setAvailableFilters] = useState<Filters>({ models: [], providers: [] });
  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'overview' | 'charts' | 'tables'>('overview');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchAvailableFilters();
  }, []);

  useEffect(() => {
    if (selectedModels.length > 0 || selectedProviders.length > 0) {
      fetchAnalytics();
    }
  }, [dateRange, selectedModels, selectedProviders]);

  const fetchAvailableFilters = async () => {
    try {
      const response = await fetch(getApiUrl('/dashboard/filters'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableFilters({
          models: data.models || [],
          providers: data.providers || []
        });
        // Auto-select all models and providers by default
        setSelectedModels(data.models || []);
        setSelectedProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      if (selectedModels.length > 0) params.append('models', selectedModels.join(','));
      if (selectedProviders.length > 0) params.append('providers', selectedProviders.join(','));

      const response = await fetch(getApiUrl('/dashboard/analytics'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const analytics = await response.json();
      setData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModelToggle = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    );
  };

  const handleProviderToggle = (provider: string) => {
    setSelectedProviders(prev => 
      prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const selectAllModels = () => {
    setSelectedModels(availableFilters.models);
  };

  const clearAllModels = () => {
    setSelectedModels([]);
  };

  const selectAllProviders = () => {
    setSelectedProviders(availableFilters.providers);
  };

  const clearAllProviders = () => {
    setSelectedProviders([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getProviderColor = (provider: string) => {
    const colors = {
      'OpenAI': 'bg-blue-500',
      'Anthropic': 'bg-purple-500',
      'Google': 'bg-green-500',
      'DeepSeek': 'bg-orange-500'
    };
    return colors[provider as keyof typeof colors] || 'bg-gray-500';
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await fetchAnalytics();
    } catch (error) {
      console.error('Error refreshing analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 transition-opacity duration-300">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your AI usage, costs, and performance</p>
          </div>

          {/* View Toggle and Refresh */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    viewMode === 'overview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setViewMode('charts')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    viewMode === 'charts'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Charts
                </button>
                <button
                  onClick={() => setViewMode('tables')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                    viewMode === 'tables'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tables
                </button>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 transition-all duration-300">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Date Range */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Date Range</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Models */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Models</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllModels}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllModels}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {availableFilters.models.map(model => (
                    <label key={model} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedModels.includes(model)}
                        onChange={() => handleModelToggle(model)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{model}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Providers */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">Providers</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllProviders}
                      className="text-xs text-blue-600 hover:text-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllProviders}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {availableFilters.providers.map(provider => (
                    <label key={provider} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProviders.includes(provider)}
                        onChange={() => handleProviderToggle(provider)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{provider}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {data && (
              <>
                {/* Overview View */}
                {viewMode === 'overview' && (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Messages</p>
                            <p className="text-2xl font-bold text-gray-900">
                              <AnimatedNumber value={data.totalUsage.messages} format={formatNumber} duration={400} />
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                            <p className="text-2xl font-bold text-gray-900">
                              <AnimatedNumber value={data.totalUsage.tokens} format={formatNumber} duration={400} />
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Cost</p>
                            <p className="text-2xl font-bold text-gray-900">
                              <AnimatedNumber value={data.totalUsage.cost} format={formatCurrency} duration={400} />
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Models</p>
                            <p className="text-2xl font-bold text-gray-900">
                              <AnimatedNumber value={data.modelBreakdown.length} format={formatNumber} duration={400} />
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts View */}
                    <DashboardCharts data={data} />
                  </div>
                )}

                {/* Charts View */}
                {viewMode === 'charts' && <DashboardCharts data={data} />}

                {/* Tables View */}
                {viewMode === 'tables' && (
                  <>
                    {/* Model Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 transition-all duration-300">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Usage</h2>
                      {data.modelBreakdown.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Tokens</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Tokens</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Input Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Output Cost</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {data.modelBreakdown.map((model) => (
                                <tr key={model.model} className="hover:bg-gray-50 transition-colors duration-150">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{model.model}</td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProviderColor(model.provider)} text-white`}>
                                      {model.provider}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <AnimatedNumber value={model.messages} format={formatNumber} duration={400} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <AnimatedNumber value={model.inputTokens} format={formatNumber} duration={400} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <AnimatedNumber value={model.outputTokens} format={formatNumber} duration={400} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <AnimatedNumber value={model.inputCost} format={formatCurrency} duration={400} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    <AnimatedNumber value={model.outputCost} format={formatCurrency} duration={400} />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <AnimatedNumber value={model.cost} format={formatCurrency} duration={400} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No model usage data found for the selected filters.</p>
                        </div>
                      )}
                    </div>

                    {/* Provider Breakdown */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 transition-all duration-300">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Provider Usage</h2>
                      {data.providerBreakdown.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {data.providerBreakdown.map((provider) => (
                            <div key={provider.provider} className="bg-gray-50 rounded-lg p-4 transition-all duration-200">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-medium text-gray-900">{provider.provider}</h3>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProviderColor(provider.provider)} text-white`}>
                                  {provider.provider}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Messages:</span>
                                  <span className="text-sm font-medium">
                                    <AnimatedNumber value={provider.messages} format={formatNumber} duration={400} />
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Tokens:</span>
                                  <span className="text-sm font-medium">
                                    <AnimatedNumber value={provider.tokens} format={formatNumber} duration={400} />
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm text-gray-600">Cost:</span>
                                  <span className="text-sm font-medium">
                                    <AnimatedNumber value={provider.cost} format={formatCurrency} duration={400} />
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No provider usage data found for the selected filters.</p>
                        </div>
                      )}
                    </div>

                    {/* Daily Usage Chart */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300">
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Usage</h2>
                      {data.dailyUsage.length > 0 ? (
                        <div className="space-y-4">
                          {data.dailyUsage.map((day) => (
                            <div key={day.date} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg transition-all duration-200">
                              <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-900">{new Date(day.date).toLocaleDateString()}</span>
                                <div className="flex space-x-6">
                                  <span className="text-sm text-gray-600">Tokens: {formatNumber(day.tokens)}</span>
                                  <span className="text-sm text-gray-600">Messages: {formatNumber(day.messages)}</span>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(day.cost)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>No daily usage data found for the selected filters.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Empty state when no data */}
            {!data && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
                <p className="text-gray-500">Try adjusting your filters or check if you have any usage data for the selected period.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 