import React, { useState } from 'react';
import { Model } from '../lib/api';

interface Props {
  models: Model[];
  selectedModels: Model[];
  onSelectionChange: (models: Model[]) => void;
  maxSelections?: number;
}

export default function ModelSelector({
  models,
  selectedModels,
  onSelectionChange,
  maxSelections = 4
}: Props) {
  const [searchTerms, setSearchTerms] = useState<string[]>(Array(maxSelections).fill(''));
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const handleSelect = (slotIndex: number, model: Model) => {
    const newSelection = [...selectedModels];
    newSelection[slotIndex] = model;

    // Remove any duplicates (if same model is selected in multiple slots)
    const uniqueSelection = newSelection.filter((m, idx, self) =>
      m && self.findIndex(x => x?.model_id === m.model_id) === idx
    );

    onSelectionChange(uniqueSelection);
    setActiveDropdown(null);

    // Clear search term
    const newSearchTerms = [...searchTerms];
    newSearchTerms[slotIndex] = '';
    setSearchTerms(newSearchTerms);
  };

  const handleRemove = (slotIndex: number) => {
    const newSelection = [...selectedModels];
    newSelection.splice(slotIndex, 1);
    onSelectionChange(newSelection);
  };

  const handleSearchChange = (slotIndex: number, value: string) => {
    const newSearchTerms = [...searchTerms];
    newSearchTerms[slotIndex] = value;
    setSearchTerms(newSearchTerms);
    setActiveDropdown(slotIndex);
  };

  const getFilteredModels = (slotIndex: number) => {
    const searchTerm = searchTerms[slotIndex]?.toLowerCase() || '';
    const selectedIds = selectedModels.map(m => m?.model_id).filter(Boolean);

    return models.filter(model =>
      (model.model_name.toLowerCase().includes(searchTerm) ||
       model.organization.toLowerCase().includes(searchTerm)) &&
      !selectedIds.includes(model.model_id)
    );
  };

  const handleReset = () => {
    onSelectionChange([]);
    setSearchTerms(Array(maxSelections).fill(''));
    setActiveDropdown(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Compare Models
        </h3>
        {selectedModels.length > 0 && (
          <button
            onClick={handleReset}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Reset All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: maxSelections }).map((_, slotIndex) => {
          const selectedModel = selectedModels[slotIndex];
          const filteredModels = getFilteredModels(slotIndex);

          return (
            <div key={slotIndex} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model {slotIndex + 1}
              </label>

              {selectedModel ? (
                // Display selected model
                <div className="flex items-center justify-between p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">
                      {selectedModel.model_name}
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {selectedModel.organization}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(slotIndex)}
                    className="ml-2 text-gray-500 hover:text-red-600"
                    title="Remove"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                // Search input
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search models..."
                    value={searchTerms[slotIndex] || ''}
                    onChange={(e) => handleSearchChange(slotIndex, e.target.value)}
                    onFocus={() => setActiveDropdown(slotIndex)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />

                  {/* Dropdown list */}
                  {activeDropdown === slotIndex && filteredModels.length > 0 && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActiveDropdown(null)}
                      />

                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {filteredModels.slice(0, 20).map(model => (
                          <button
                            key={model.model_id}
                            onClick={() => handleSelect(slotIndex, model)}
                            className="w-full text-left p-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-semibold text-sm text-gray-900">
                              {model.model_name}
                            </div>
                            <div className="text-xs text-gray-600">
                              {model.organization}
                              {model.benchmarks && ` • ${model.benchmarks.length} benchmarks`}
                            </div>
                          </button>
                        ))}
                        {filteredModels.length > 20 && (
                          <div className="p-3 text-xs text-gray-500 text-center">
                            Showing first 20 results. Keep typing to narrow down...
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedModels.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          Comparing {selectedModels.length} {selectedModels.length === 1 ? 'model' : 'models'}
        </div>
      )}
    </div>
  );
}
