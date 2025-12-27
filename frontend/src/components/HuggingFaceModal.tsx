import React from 'react';
import { Model } from '../lib/api';

interface Props {
  model: Model;
  onClose: () => void;
}

export default function HuggingFaceModal({ model, onClose }: Props) {
  const hasHfData = model.hf_license || model.hf_parameters || model.hf_benchmarks;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75" />

        {/* Modal panel */}
        <div
          className="relative inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {model.model_name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {model.organization}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Leaderboard Benchmarks */}
            {model.benchmarks && model.benchmarks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Leaderboard Benchmarks
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {model.benchmarks.map((benchmark, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg"
                    >
                      <div className="text-xs text-gray-600 mb-1">
                        {benchmark.name}
                      </div>
                      <div className="text-2xl font-bold text-blue-700">
                        {benchmark.score?.toFixed(1) || 'N/A'}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* HuggingFace Data */}
            {hasHfData ? (
              <>
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900">
                      HuggingFace Details
                    </h3>
                  </div>

                  {/* Model Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {model.hf_license && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">License</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {model.hf_license}
                        </div>
                      </div>
                    )}
                    {model.hf_parameters && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Parameters</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {model.hf_parameters}
                        </div>
                      </div>
                    )}
                    {model.hf_context_window && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Context Window</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {model.hf_context_window.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {model.hf_downloads !== undefined && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Downloads</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {model.hf_downloads.toLocaleString()}
                        </div>
                      </div>
                    )}
                    {model.hf_likes !== undefined && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600 mb-1">Likes</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {model.hf_likes.toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HuggingFace Benchmarks */}
                  {model.hf_benchmarks && model.hf_benchmarks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Additional HuggingFace Benchmarks
                      </h4>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {model.hf_benchmarks.slice(0, 15).map((benchmark, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-purple-50 rounded text-center"
                          >
                            <div className="text-xs text-gray-600">{benchmark.name}</div>
                            <div className="text-sm font-bold text-purple-700">
                              {benchmark.score?.toFixed(1)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {model.hf_benchmarks.length > 15 && (
                        <p className="text-xs text-gray-500 mt-2">
                          +{model.hf_benchmarks.length - 15} more benchmarks
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="border-t pt-6">
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p>No additional HuggingFace data available for this model</p>
                  <p className="text-sm text-gray-400 mt-1">
                    The model may not exist on HuggingFace or the ID doesn't match
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              {model.hf_url && (
                <a
                  href={model.hf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white font-semibold rounded-lg hover:from-yellow-500 hover:to-yellow-600 transition-all text-center"
                >
                  View on HuggingFace →
                </a>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
