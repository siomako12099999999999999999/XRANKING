import React, { useState } from 'react';

interface SearchFiltersProps {
  initialPeriod: 'day' | 'week' | 'month' | 'all';
  initialSort: 'likes' | 'retweets' | 'views' | 'latest';
  onFilterChange: (period: string, sort: string) => void;
}

export default function SearchFilters({ 
  initialPeriod = 'week', 
  initialSort = 'likes',
  onFilterChange
}: SearchFiltersProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [sort, setSort] = useState(initialSort);

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    onFilterChange(newPeriod, sort);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSort(newSort);
    onFilterChange(period, newSort);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1">
            期間
          </label>
          <select
            id="period"
            value={period}
            onChange={handlePeriodChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="day">24時間</option>
            <option value="week">1週間</option>
            <option value="month">1ヶ月</option>
            <option value="all">全期間</option>
          </select>
        </div>
        
        <div className="flex-1">
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            並び替え
          </label>
          <select
            id="sort"
            value={sort}
            onChange={handleSortChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="likes">いいね数</option>
            <option value="retweets">リツイート数</option>
            <option value="views">再生回数</option>
            <option value="latest">新着順</option>
          </select>
        </div>
      </div>
    </div>
  );
}