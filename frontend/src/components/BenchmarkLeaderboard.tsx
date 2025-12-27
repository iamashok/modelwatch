import React from 'react';
import { Model } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  models: Model[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function BenchmarkLeaderboard({ models }: Props) {
  // Get all unique benchmark names
  const allBenchmarks = Array.from(
    new Set(models.flatMap(m => m.benchmarks?.map(b => b.name) || []))
  );

  // Filter to show only main benchmarks in order
  const mainBenchmarks = ['MMLU', 'Arc-Challenge', 'HellaSwag', 'TruthfulQA', 'Winogrande', 'GSM8K'];
  const benchmarksToShow = mainBenchmarks.filter(name => allBenchmarks.includes(name));

  // Get top 5 models for each benchmark
  const getTop5ForBenchmark = (benchmarkName: string) => {
    const modelsWithScore = models
      .map(model => {
        const benchmark = model.benchmarks?.find(b => b.name === benchmarkName);
        return {
          model,
          score: benchmark?.score || 0
        };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return modelsWithScore.map(item => ({
      name: item.model.model_name.length > 25
        ? item.model.model_name.substring(0, 25) + '...'
        : item.model.model_name,
      score: item.score,
      fullName: item.model.model_name
    }));
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Benchmark Leaderboards</h2>
        <p className="text-gray-600">Top 5 performing models for each benchmark</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benchmarksToShow.map((benchmarkName, idx) => {
          const topModels = getTop5ForBenchmark(benchmarkName);

          if (topModels.length === 0) return null;

          return (
            <div key={benchmarkName} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span>
                {benchmarkName}
              </h3>

              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={topModels}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={95}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-sm text-gray-900">{data.fullName}</p>
                            <p className="text-blue-600 font-bold">{data.score.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {topModels.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Ranking List */}
              <div className="mt-4 space-y-2">
                {topModels.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold
                        ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'}
                      `}>
                        {index + 1}
                      </span>
                      <span className="text-gray-700 truncate max-w-[180px]" title={item.fullName}>
                        {item.name}
                      </span>
                    </div>
                    <span className="font-semibold text-blue-600">{item.score.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
