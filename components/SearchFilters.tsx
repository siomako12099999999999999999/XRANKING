'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Period, SortType } from '@/app/types';

interface SearchFiltersProps {
  initialPeriod: Period;
  initialSort: SortType;
  onFilterChange: (period: Period, sort: SortType) => void;
}

export default function SearchFilters({ 
  initialPeriod, 
  initialSort, 
  onFilterChange 
}: SearchFiltersProps) {
  const [sort, setSort] = useState(initialSort);
  const [period, setPeriod] = useState(initialPeriod);
  const router = useRouter();

  useEffect(() => {
    // URL更新
    const searchParams = new URLSearchParams();
    searchParams.set('sort', sort);
    searchParams.set('period', period);
    router.push(`/?${searchParams.toString()}`);
  }, [sort, period, router]);

  const handleSortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as SortType;
    setSort(value);
    onFilterChange(period, value);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value as Period;
    setPeriod(value);
    onFilterChange(value, sort);
  };

  return (
    <div className="space-y-6">
      {/* ソート順 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          ソート順
        </h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="sort-likes"
              name="sort"
              type="radio"
              value="likes"
              checked={sort === 'likes'}
              onChange={handleSortChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="sort-likes"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              いいね数
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sort-latest"
              name="sort"
              type="radio"
              value="latest"
              checked={sort === 'latest'}
              onChange={handleSortChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="sort-latest"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              最新順
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="sort-trending"
              name="sort"
              type="radio"
              value="trending"
              checked={sort === 'trending'}
              onChange={handleSortChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="sort-trending"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              トレンド
            </label>
          </div>
        </div>
      </div>
      
      {/* 期間 */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          期間
        </h3>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="period-day"
              name="period"
              type="radio"
              value="day"
              checked={period === 'day'}
              onChange={handlePeriodChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="period-day"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              24時間
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="period-week"
              name="period"
              type="radio"
              value="week"
              checked={period === 'week'}
              onChange={handlePeriodChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="period-week"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              過去7日間
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="period-month"
              name="period"
              type="radio"
              value="month"
              checked={period === 'month'}
              onChange={handlePeriodChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="period-month"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              過去30日間
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="period-all"
              name="period"
              type="radio"
              value="all"
              checked={period === 'all'}
              onChange={handlePeriodChange}
              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <label 
              htmlFor="period-all"
              className="ml-3 text-sm text-gray-700 dark:text-gray-300"
            >
              すべて
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}