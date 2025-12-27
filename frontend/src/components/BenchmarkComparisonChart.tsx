import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Model } from '../lib/api';

interface Props {
  models: Model[];
  selectedBenchmark?: string;
}

const COLORS = {
  model1: '#9FC9FF',
  model2: '#FC69D3',
  model3: '#FFB84D',
  model4: '#A78BFA',
};

export default function BenchmarkComparisonChart({ models, selectedBenchmark }: Props) {
  if (!models || models.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select models to compare
      </div>
    );
  }

  // Get all unique benchmark names from selected models
  const allBenchmarkNames = Array.from(
    new Set(
      models.flatMap(m => m.benchmarks?.map(b => b.name) || [])
    )
  );

  // Filter by selected benchmark if specified
  const benchmarksToShow = selectedBenchmark
    ? [selectedBenchmark]
    : allBenchmarkNames;

  // Prepare data for the chart
  const chartData = benchmarksToShow.map(benchmarkName => {
    const dataPoint: any = { benchmark: benchmarkName };

    models.forEach((model, index) => {
      const benchmark = model.benchmarks?.find(b => b.name === benchmarkName);
      dataPoint[model.model_name] = benchmark?.score || 0;
    });

    return dataPoint;
  });

  // Get model names for the legend
  const modelNames = models.map(m => m.model_name);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">
        Benchmark Comparison
      </h3>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="benchmark"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#666', fontSize: 12 }}
          />
          <YAxis
            label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }}
            tick={{ fill: '#666' }}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '12px'
            }}
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />

          {models.map((model, index) => (
            <Bar
              key={model.model_id}
              dataKey={model.model_name}
              fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {models.map((model, index) => (
          <div
            key={model.model_id}
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
            />
            <div>
              <div className="font-semibold text-sm text-gray-900">
                {model.model_name}
              </div>
              <div className="text-xs text-gray-600">
                {model.organization}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
