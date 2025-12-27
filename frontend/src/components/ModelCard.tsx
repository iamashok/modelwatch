import React, { useState } from 'react';
import { Model } from '../lib/api';
import ModelDetailModal from './ModelDetailModal';

interface ModelCardProps {
  model: Model;
  rank: number;
}

const ModelCard: React.FC<ModelCardProps> = ({ model, rank }) => {
  const [showDetail, setShowDetail] = useState(false);
  const avgScore = model.benchmarks.length > 0
    ? model.benchmarks.reduce((sum, b) => sum + (b.score || 0), 0) / model.benchmarks.length
    : 0;

  return (
    <>
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
        onClick={() => setShowDetail(true)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-blue-600">#{rank}</span>
              <h3 className="text-lg font-semibold text-gray-900">{model.model_name}</h3>
            </div>
            <p className="text-sm text-gray-500">{model.organization}</p>
          </div>
          {model.license && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
              {model.license}
            </span>
          )}
        </div>

        {model.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {model.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          {model.parameters && (
            <div>
              <p className="text-xs text-gray-500">Parameters</p>
              <p className="text-sm font-semibold text-gray-900">{model.parameters}</p>
            </div>
          )}
          {model.context_window && (
            <div>
              <p className="text-xs text-gray-500">Context</p>
              <p className="text-sm font-semibold text-gray-900">
                {(model.context_window / 1000).toFixed(0)}K
              </p>
            </div>
          )}
          {model.downloads != null && (
            <div>
              <p className="text-xs text-gray-500">Downloads</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatNumber(model.downloads)}
              </p>
            </div>
          )}
          {model.likes != null && (
            <div>
              <p className="text-xs text-gray-500">Likes</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatNumber(model.likes)}
              </p>
            </div>
          )}
        </div>

        {model.benchmarks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-700">Avg Score</p>
              <p className="text-lg font-bold text-blue-600">{avgScore.toFixed(1)}%</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(avgScore, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {model.benchmarks.length} benchmark{model.benchmarks.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {showDetail && (
        <ModelDetailModal model={model} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
};

function formatNumber(num: number | undefined | null): string {
  if (!num) return 'N/A';
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

export default ModelCard;
