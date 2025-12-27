import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import BenchmarkLeaderboard from '@/components/BenchmarkLeaderboard';
import SortableModelsTable from '@/components/SortableModelsTable';
import HuggingFaceModal from '@/components/HuggingFaceModal';
import { getModels, getStats, LeaderboardResponse, Stats, Model } from '@/lib/api';

export default function Home() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'charts' | 'table'>('charts');
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
                      <p className="text-xs text-gray-500">Scores</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setView('charts')}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      view === 'charts'
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Charts
                  </button>
                  <button
                    onClick={() => setView('table')}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
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
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading leaderboard data...</p>
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
            <>
              {view === 'charts' ? (
                <BenchmarkLeaderboard models={data.models} />
              ) : (
                <div>
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">All Models</h2>
                    <p className="text-gray-600">Click on any row to view detailed information</p>
                  </div>
                  <SortableModelsTable
                    models={data.models}
                    onModelClick={setModalModel}
                  />
                </div>
              )}
            </>
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
                Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleString() : 'N/A'}
              </p>
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}
