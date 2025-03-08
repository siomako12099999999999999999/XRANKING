import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type PeriodOption = 'day' | 'week' | 'month' | 'all';
type SortOption = 'likes' | 'retweets' | 'views' | 'latest';

interface SearchFiltersProps {
  initialPeriod?: PeriodOption;
  initialSort?: SortOption;
  onFilterChange?: (period: PeriodOption, sort: SortOption) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ 
  initialPeriod = 'week', 
  initialSort = 'likes',
  onFilterChange 
}) => {
  const [period, setPeriod] = useState<PeriodOption>(initialPeriod);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const router = useRouter();

  const handlePeriodChange = (newPeriod: PeriodOption) => {
    setPeriod(newPeriod);
    if (onFilterChange) {
      onFilterChange(newPeriod, sort);
    }
    
    // URLパラメータを更新
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('period', newPeriod);
    router.push(`/?${searchParams.toString()}`);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    if (onFilterChange) {
      onFilterChange(period, newSort);
    }
    
    // URLパラメータを更新
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('sort', newSort);
    router.push(`/?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
      <div className="w-full sm:w-1/2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">期間</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handlePeriodChange('day')}
            className={`px-3 py-2 text-sm rounded-md ${
              period === 'day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            24時間
          </button>
          <button
            onClick={() => handlePeriodChange('week')}
            className={`px-3 py-2 text-sm rounded-md ${
              period === 'week' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            1週間
          </button>
          <button
            onClick={() => handlePeriodChange('month')}
            className={`px-3 py-2 text-sm rounded-md ${
              period === 'month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            1ヶ月
          </button>
          <button
            onClick={() => handlePeriodChange('all')}
            className={`px-3 py-2 text-sm rounded-md ${
              period === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            全期間
          </button>
        </div>
      </div>
      
      <div className="w-full sm:w-1/2">
        <h3 className="text-sm font-medium text-gray-700 mb-2">並び替え</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleSortChange('likes')}
            className={`px-3 py-2 text-sm rounded-md ${
              sort === 'likes' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            いいね
          </button>
          <button
            onClick={() => handleSortChange('retweets')}
            className={`px-3 py-2 text-sm rounded-md ${
              sort === 'retweets' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            リツイート
          </button>
          <button
            onClick={() => handleSortChange('views')}
            className={`px-3 py-2 text-sm rounded-md ${
              sort === 'views' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            再生数
          </button>
          <button
            onClick={() => handleSortChange('latest')}
            className={`px-3 py-2 text-sm rounded-md ${
              sort === 'latest' 
                ? 'bg-blue-500 text-white' 
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            新着
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;