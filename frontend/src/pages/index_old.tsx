import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import LeaderboardTable from '@/components/LeaderboardTable';
import ModelCard from '@/components/ModelCard';
import ModelSelector from '@/components/ModelSelector';
import BenchmarkComparisonChart from '@/components/BenchmarkComparisonChart';
import HuggingFaceModal from '@/components/HuggingFaceModal';
import { getModels, getStats, LeaderboardResponse, Stats, Model } from '@/lib/api';

export default function Home() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'table' | 'compare'>('compare');
  const [selectedModels, setSelectedModels] = useState<Model[]>([]);
  const [modalModel, setModalModel] = useState<Model | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [modelsData, statsData] = await Promise.all([
          getModels(),
          getStats()
        ]);
        setData(modelsData);
        setStats(statsData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const topModels = data?.models
    .filter(m => m.benchmarks.length > 0)
    .sort((a, b) => {
      const avgA = a.benchmarks.reduce((sum, b) => sum + (b.score || 0), 0) / a.benchmarks.length;
      const avgB = b.benchmarks.reduce((sum, b) => sum + (b.score || 0), 0) / b.benchmarks.length;
      return avgB - avgA;
    })
    .slice(0, 3) || [];

  return (
    <>
      <Head>
        <title>ModelWatch - Open Source LLM Leaderboard</title>
        <meta name="description" content="Track the latest open-source LLM benchmarks and performance" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">M</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    ModelWatch
                  </h1>
                  <p className="text-xs text-gray-500">Open Source LLM Leaderboard</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {stats && (
                  <div className="hidden sm:flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{stats.total_models}</p>
                      <p className="text-xs text-gray-500">Models</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="font-bold text-gray-900">{stats.total_benchmark_scores}</p>
                      <p className="text-xs text-gray-500">Benchmarks</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setView('compare')}
                    className={`px-3 py-1.5 text-sm rounded ${
                      view === 'compare'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => setView('grid')}
                    className={`px-3 py-1.5 text-sm rounded ${
                      view === 'grid'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setView('table')}
                    className={`px-3 py-1.5 text-sm rounded ${
                      view === 'table'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Table
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          {!loading && !error && (
            <div className="mb-8">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-3">
                  Latest Open Source Models
                </h2>
                <p className="text-lg text-gray-600">
                  Real-time benchmarks from llm-stats.com and HuggingFace
                </p>
                {stats?.last_updated && (
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date(stats.last_updated).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Top 3 Models */}
              {topModels.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Top Performers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {topModels.map((model, idx) => (
                      <ModelCard key={model.model_id} model={model} rank={idx + 1} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading latest models...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                  <p className="mt-2 text-sm text-red-700">{error}</p>
                  <p className="mt-2 text-xs text-red-600">
                    Make sure the backend API is running on port 8000
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && data && (
            <div>
              {view === 'compare' ? (
                <div className="space-y-8">
                  {/* Model Comparison Section */}
                  <ModelSelector
                    models={data.models}
                    selectedModels={selectedModels}
                    onSelectionChange={setSelectedModels}
                    maxSelections={4}
                  />

                  {/* Benchmark Comparison Chart */}
                  {selectedModels.length > 0 && (
                    <BenchmarkComparisonChart models={selectedModels} />
                  )}

                  {/* Selected Models Detail Cards */}
                  {selectedModels.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Selected Models Detail
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {selectedModels.map((model) => (
                          <div
                            key={model.model_id}
                            className="bg-white border-2 border-blue-300 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
                            onClick={() => setModalModel(model)}
                          >
                            <h4 className="font-bold text-gray-900 mb-2 truncate">
                              {model.model_name}
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                              {model.organization}
                            </p>
                            <div className="space-y-1">
                              {model.benchmarks.slice(0, 3).map((benchmark, idx) => (
                                <div key={idx} className="flex justify-between text-xs">
                                  <span className="text-gray-600">{benchmark.name}</span>
                                  <span className="font-semibold text-blue-600">
                                    {benchmark.score?.toFixed(1) || 'N/A'}%
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium">
                              View HuggingFace Details →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Models Section */}
                  <div className="pt-8 border-t border-gray-200">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">
                      All Models ({data.total_count})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.models.map((model, idx) => (
                        <div
                          key={model.model_id}
                          onClick={() => setModalModel(model)}
                        >
                          <ModelCard model={model} rank={idx + 1} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      All Models ({data.total_count})
                    </h2>
                  </div>

                  {view === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {data.models.map((model, idx) => (
                        <div
                          key={model.model_id}
                          onClick={() => setModalModel(model)}
                        >
                          <ModelCard model={model} rank={idx + 1} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <LeaderboardTable models={data.models} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HuggingFace Modal */}
          {modalModel && (
            <HuggingFaceModal
              model={modalModel}
              onClose={() => setModalModel(null)}
            />
          )}

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center text-sm text-gray-500">
              <p className="mb-2">
                Data sourced from{' '}
                <a href="https://llm-stats.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  llm-stats.com
                </a>
                {' '}and{' '}
                <a href="https://huggingface.co" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  HuggingFace
                </a>
              </p>
              <p className="text-xs text-gray-400">
                Built with Next.js, FastAPI, Playwright, and Python
              </p>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
