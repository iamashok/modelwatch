import React, { useState, useMemo } from 'react';
import { Model } from '../lib/api';

interface Props {
  models: Model[];
  onModelClick?: (model: Model) => void;
}

type SortField =
  | 'model_name'
  | 'input_price_per_1m'
  | 'output_price_per_1m'
  | 'parameters'
  | 'MMLU'
  | 'Arc-Challenge'
  | 'HellaSwag'
  | 'TruthfulQA';

export default function SortableModelsTable({ models, onModelClick }: Props) {
  const [sortField, setSortField] = useState<SortField>('MMLU');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case 'model_name':
          aVal = a.model_name.toLowerCase();
          bVal = b.model_name.toLowerCase();
          break;
        case 'input_price_per_1m':
          aVal = a.input_price_per_1m || 999;
          bVal = b.input_price_per_1m || 999;
          break;
        case 'output_price_per_1m':
          aVal = a.output_price_per_1m || 999;
          bVal = b.output_price_per_1m || 999;
          break;
        case 'parameters':
          aVal = parseParameters(a.parameters);
          bVal = parseParameters(b.parameters);
          break;
        default:
          // It's a benchmark name
          const aBench = a.benchmarks?.find(b => b.name === sortField);
          const bBench = b.benchmarks?.find(b => b.name === sortField);
          aVal = aBench?.score || 0;
          bVal = bBench?.score || 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      // Both are numbers at this point
      const aNum = aVal as number;
      const bNum = bVal as number;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [models, sortField, sortDirection]);

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field && (
          <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
        )}
      </div>
    </th>
  );

  const getBenchmarkScore = (model: Model, benchmarkName: string) => {
    const benchmark = model.benchmarks?.find(b => b.name === benchmarkName);
    return benchmark?.score;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
              <SortHeader field="model_name">Model</SortHeader>
              <SortHeader field="input_price_per_1m">Input $/M</SortHeader>
              <SortHeader field="output_price_per_1m">Output $/M</SortHeader>
              <SortHeader field="MMLU">MMLU</SortHeader>
              <SortHeader field="Arc-Challenge">ARC</SortHeader>
              <SortHeader field="HellaSwag">HellaSwag</SortHeader>
              <SortHeader field="TruthfulQA">TruthfulQA</SortHeader>
              <SortHeader field="parameters">Params</SortHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedModels.map((model, idx) => (
              <tr
                key={model.model_id}
                className="hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => onModelClick?.(model)}
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {idx + 1}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{model.model_name}</div>
                    <div className="text-xs text-gray-500">{model.organization}</div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {model.input_price_per_1m != null ? (
                    <span className="text-green-600 font-semibold">
                      ${model.input_price_per_1m.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  {model.output_price_per_1m != null ? (
                    <span className="text-green-600 font-semibold">
                      ${model.output_price_per_1m.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <BenchmarkCell score={getBenchmarkScore(model, 'MMLU')} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <BenchmarkCell score={getBenchmarkScore(model, 'Arc-Challenge')} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <BenchmarkCell score={getBenchmarkScore(model, 'HellaSwag')} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <BenchmarkCell score={getBenchmarkScore(model, 'TruthfulQA')} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                  {model.parameters || '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BenchmarkCell({ score }: { score?: number | null }) {
  if (score == null) {
    return <span className="text-gray-400">-</span>;
  }

  const getColorClass = () => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <span className={`px-2 py-1 rounded font-semibold ${getColorClass()}`}>
      {score.toFixed(1)}%
    </span>
  );
}

function parseParameters(params: string | null | undefined): number {
  if (!params) return 0;
  const match = params.match(/(\d+\.?\d*)([BMK])?/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase();

  const multipliers: Record<string, number> = {
    'K': 1e-6, // Convert to B
    'M': 1e-3, // Convert to B
    'B': 1,
  };

  return value * (multipliers[unit || 'B'] || 1);
}
