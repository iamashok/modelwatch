import React, { useState, useMemo } from 'react';
import { Model, Benchmark } from '../lib/api';
import clsx from 'clsx';

interface LeaderboardTableProps {
  models: Model[];
}

type SortField = 'model_name' | 'parameters' | 'context_window' | 'downloads' | 'likes' | 'benchmarks';
type SortDirection = 'asc' | 'desc';

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ models }) => {
  const [sortField, setSortField] = useState<SortField>('likes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique categories from all benchmarks
  const categories = useMemo(() => {
    const cats = new Set<string>();
    models.forEach(model => {
      model.benchmarks.forEach(bench => {
        if (bench.category) cats.add(bench.category);
      });
    });
    return ['all', ...Array.from(cats).sort()];
  }, [models]);

  // Get common benchmarks (appearing in multiple models)
  const commonBenchmarks = useMemo(() => {
    const benchmarkCounts: Record<string, number> = {};
    models.forEach(model => {
      model.benchmarks.forEach(bench => {
        benchmarkCounts[bench.name] = (benchmarkCounts[bench.name] || 0) + 1;
      });
    });

    return Object.entries(benchmarkCounts)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  }, [models]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAndFilteredModels = useMemo(() => {
    let filtered = models;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.model_name.toLowerCase().includes(query) ||
        m.organization.toLowerCase().includes(query) ||
        m.model_id.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m =>
        m.benchmarks.some(b => b.category === selectedCategory)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case 'model_name':
          aVal = a.model_name;
          bVal = b.model_name;
          break;
        case 'parameters':
          aVal = parseParamString(a.parameters);
          bVal = parseParamString(b.parameters);
          break;
        case 'context_window':
          aVal = a.context_window || 0;
          bVal = b.context_window || 0;
          break;
        case 'downloads':
          aVal = a.downloads || 0;
          bVal = b.downloads || 0;
          break;
        case 'likes':
          aVal = a.likes || 0;
          bVal = b.likes || 0;
          break;
        case 'benchmarks':
          aVal = a.benchmarks.length;
          bVal = b.benchmarks.length;
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [models, sortField, sortDirection, selectedCategory, searchQuery]);

  const getBenchmarkScore = (model: Model, benchmarkName: string): number | null => {
    const bench = model.benchmarks.find(b => b.name === benchmarkName);
    return bench?.score ?? null;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader
                label="Model"
                field="model_name"
                currentField={sortField}
                direction={sortDirection}
                onClick={() => handleSort('model_name')}
              />
              <SortableHeader
                label="Parameters"
                field="parameters"
                currentField={sortField}
                direction={sortDirection}
                onClick={() => handleSort('parameters')}
              />
              <SortableHeader
                label="Context"
                field="context_window"
                currentField={sortField}
                direction={sortDirection}
                onClick={() => handleSort('context_window')}
              />
              <SortableHeader
                label="License"
                field="model_name"
                currentField={sortField}
                direction={sortDirection}
                onClick={() => {}}
              />
              {commonBenchmarks.map(benchName => (
                <th key={benchName} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {benchName}
                </th>
              ))}
              <SortableHeader
                label="Downloads"
                field="downloads"
                currentField={sortField}
                direction={sortDirection}
                onClick={() => handleSort('downloads')}
              />
              <SortableHeader
                label="Likes"
                field="likes"
                currentField={sortField}
                direction={sortDirection}
                onClick={() => handleSort('likes')}
              />
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAndFilteredModels.map((model) => (
              <tr key={model.model_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{model.model_name}</div>
                    <div className="text-xs text-gray-500">{model.organization}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.parameters || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.context_window ? formatNumber(model.context_window) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {model.license || 'Unknown'}
                  </span>
                </td>
                {commonBenchmarks.map(benchName => {
                  const score = getBenchmarkScore(model, benchName);
                  return (
                    <td key={benchName} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {score !== null ? (
                        <span className={clsx(
                          'px-2 py-1 rounded',
                          score >= 80 ? 'bg-green-100 text-green-800' :
                          score >= 60 ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        )}>
                          {score.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.downloads ? formatNumber(model.downloads) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {model.likes ? formatNumber(model.likes) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAndFilteredModels.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No models found matching your criteria.
        </div>
      )}
    </div>
  );
};

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentField: SortField;
  direction: SortDirection;
  onClick: () => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentField,
  direction,
  onClick
}) => {
  const isActive = field === currentField;

  return (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-1">
        {label}
        {isActive && (
          <span className="text-primary-600">
            {direction === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );
};

function parseParamString(params: string | null | undefined): number {
  if (!params) return 0;
  const match = params.match(/(\d+\.?\d*)([BMK])/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  const multipliers: Record<string, number> = {
    'K': 1e3,
    'M': 1e6,
    'B': 1e9,
  };

  return value * (multipliers[unit] || 1);
}

function formatNumber(num: number): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

export default LeaderboardTable;
