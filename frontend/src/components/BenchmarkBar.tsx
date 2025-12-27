import React from 'react';

interface BenchmarkBarProps {
  name: string;
  score: number;
  category?: string;
  maxScore?: number;
}

const BenchmarkBar: React.FC<BenchmarkBarProps> = ({
  name,
  score,
  category,
  maxScore = 100
}) => {
  const percentage = (score / maxScore) * 100;

  const getColorClass = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-blue-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getCategoryBadgeColor = () => {
    switch (category) {
      case 'reasoning': return 'bg-purple-100 text-purple-700';
      case 'coding': return 'bg-blue-100 text-blue-700';
      case 'agents': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{name}</span>
          {category && (
            <span className={`text-xs px-2 py-0.5 rounded ${getCategoryBadgeColor()}`}>
              {category}
            </span>
          )}
        </div>
        <span className="text-sm font-bold text-gray-900">{score.toFixed(1)}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${getColorClass()} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default BenchmarkBar;
