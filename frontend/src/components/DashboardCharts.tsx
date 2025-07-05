import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

interface DashboardChartsProps {
  data: DashboardData;
}

const DashboardCharts: React.FC<DashboardChartsProps> = React.memo(({ data }) => {
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

  // Daily Usage Line Chart
  const dailyUsageChartData = {
    labels: data.dailyUsage.map(day => new Date(day.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Cost ($)',
        data: data.dailyUsage.map(day => day.cost),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y',
      },
      {
        label: 'Messages',
        data: data.dailyUsage.map(day => day.messages),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      },
    ],
  };

  const dailyUsageChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Usage Trends',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'line'>) {
            if (context.dataset.label === 'Cost ($)') {
              return `Cost: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Messages',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Model Breakdown Doughnut Chart (organized)
  const sortedModels = [...data.modelBreakdown].sort((a, b) => b.cost - a.cost);
  const topN = 6;
  const topModels = sortedModels.slice(0, topN);
  const otherTotal = sortedModels.slice(topN).reduce((sum, m) => sum + m.cost, 0);

  const labels = [
    ...topModels.map(m => m.model),
    ...(otherTotal > 0 ? ['Other'] : [])
  ];
  const values = [
    ...topModels.map(m => m.cost),
    ...(otherTotal > 0 ? [otherTotal] : [])
  ];
  const backgroundColors = [
    'rgba(59, 130, 246, 0.8)',   // gpt-4o
    'rgba(16, 185, 129, 0.8)',  // gpt-4o-mini
    'rgba(245, 158, 11, 0.8)',  // gemini-1.5-pro
    'rgba(239, 68, 68, 0.8)',   // claude-3-opus
    'rgba(147, 51, 234, 0.8)',  // gemini-1.5-flash
    'rgba(236, 72, 153, 0.8)',  // gemini-1.0-pro
    'rgba(156, 163, 175, 0.8)', // Other (gray)
  ];

  // Interactive legend state
  const [visible, setVisible] = useState(() => Array(labels.length).fill(true));
  const handleLegendClick = (idx: number) => {
    setVisible(v => v.map((val, i) => (i === idx ? !val : val)));
  };

  // Filter data for visible slices
  const filteredLabels = labels.filter((_, i) => visible[i]);
  const filteredValues = values.filter((_, i) => visible[i]);
  const filteredColors = backgroundColors.filter((_, i) => visible[i]);

  const modelBreakdownChartData = {
    labels: filteredLabels,
    datasets: [
      {
        data: filteredValues,
        backgroundColor: filteredColors,
        borderColor: filteredColors,
        borderWidth: 2,
      },
    ],
  };

  const modelBreakdownChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Cost Distribution by Model',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'doughnut'>) {
            const value = context.raw as number;
            const percent = ((value / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${context.label}: $${value.toFixed(4)} (${percent}%)`;
          }
        }
      }
    }
  };

  // Custom legend rendering (2 columns)
  const legendItems = labels.map((label, i) => ({
    label,
    color: backgroundColors[i],
  }));

  // Provider Comparison Bar Chart
  const providerComparisonChartData = {
    labels: data.providerBreakdown.map(provider => provider.provider),
    datasets: [
      {
        label: 'Cost ($)',
        data: data.providerBreakdown.map(provider => provider.cost),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
      {
        label: 'Messages',
        data: data.providerBreakdown.map(provider => provider.messages),
        backgroundColor: 'rgba(147, 51, 234, 0.8)',
        borderColor: 'rgba(147, 51, 234, 1)',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  };

  const providerComparisonChartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Provider Comparison',
      },
      tooltip: {
        callbacks: {
          label: function(context: TooltipItem<'bar'>) {
            if (context.dataset.label === 'Cost ($)') {
              return `Cost: ${formatCurrency(context.parsed.y)}`;
            }
            return `${context.dataset.label}: ${formatNumber(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Provider',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Messages',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Daily Usage Trends */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="h-80">
          <Line data={dailyUsageChartData} options={dailyUsageChartOptions} />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Model Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between h-full">
          <div className="w-full flex justify-center">
            <h2 className="text-base font-semibold text-gray-900 mb-4 text-center">Cost Distribution by Model</h2>
          </div>
          <div className="flex flex-1 flex-row items-center justify-center gap-8 min-h-0">
            <div className="h-48 w-48 flex-shrink-0 flex items-center justify-center">
              <Doughnut data={modelBreakdownChartData} options={{
                ...modelBreakdownChartOptions,
                plugins: {
                  ...modelBreakdownChartOptions.plugins,
                  title: { display: false },
                }
              }} />
            </div>
            <div className="flex justify-center w-full">
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                {legendItems.map((item, idx) => (
                  <div
                    key={item.label}
                    className={`flex items-center space-x-2 min-w-0 cursor-pointer select-none ${!visible[idx] ? 'opacity-40' : ''}`}
                    onClick={() => handleLegendClick(idx)}
                    title={visible[idx] ? `Hide ${item.label}` : `Show ${item.label}`}
                  >
                    <span className="inline-block w-4 h-4 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                    <span className="text-gray-700 font-medium text-xs truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Provider Comparison */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="h-80">
            <Bar data={providerComparisonChartData} options={providerComparisonChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
});

export default DashboardCharts; 