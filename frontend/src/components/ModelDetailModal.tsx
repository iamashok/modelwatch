import React from 'react';
import { Model } from '../lib/api';
import BenchmarkBar from './BenchmarkBar';

interface ModelDetailModalProps {
  model: Model;
  onClose: () => void;
}

const ModelDetailModal: React.FC<ModelDetailModalProps> = ({ model, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{model.model_name}</h2>
            <p className="text-sm text-gray-500">{model.model_id}</p>
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
        <div className="px-6 py-6 space-y-6">
          {/* Description */}
          {model.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700">{model.description}</p>
            </div>
          )}

          {/* Specifications */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {model.license && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">License</p>
                  <p className="font-semibold text-gray-900">{model.license}</p>
                </div>
              )}
              {model.parameters && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Parameters</p>
                  <p className="font-semibold text-gray-900">{model.parameters}</p>
                </div>
              )}
              {model.context_window && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Context Window</p>
                  <p className="font-semibold text-gray-900">
                    {model.context_window.toLocaleString()} tokens
                  </p>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {model.is_open_source ? 'Open Source' : 'Proprietary'}
                </p>
              </div>
            </div>
          </div>

          {/* HuggingFace Stats */}
          {(model.downloads != null || model.likes != null) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">HuggingFace Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                {model.downloads != null && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <p className="text-sm text-gray-600">Downloads</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {model.downloads.toLocaleString()}
                    </p>
                  </div>
                )}
                {model.likes != null && (
                  <div className="bg-pink-50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-gray-600">Likes</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {model.likes.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benchmarks */}
          {model.benchmarks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Benchmarks ({model.benchmarks.length})
              </h3>
              <div className="space-y-1">
                {model.benchmarks
                  .sort((a, b) => (b.score || 0) - (a.score || 0))
                  .map((benchmark, idx) => (
                    <BenchmarkBar
                      key={idx}
                      name={benchmark.name}
                      score={benchmark.score || 0}
                      category={benchmark.category || undefined}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Additional Info */}
          {model.arxiv_id && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Research Paper</h3>
              <a
                href={`https://arxiv.org/abs/${model.arxiv_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-2"
              >
                arXiv:{model.arxiv_id}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {/* Links */}
          <div className="flex gap-3 pt-4 border-t">
            <a
              href={`https://huggingface.co/${model.model_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-center font-medium"
            >
              View on HuggingFace
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelDetailModal;
