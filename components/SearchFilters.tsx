/**
 * 機能概要：
 * 検索フィルタコンポーネント
 * 
 * 主な機能：
 * 1. ソート順の選択機能
 * 2. 期間フィルタの選択機能
 * 3. URLクエリパラメータの更新
 * 4. フィルタ変更の通知
 * 
 * 用途：
 * - ツイートの絞り込み
 * - データのソート制御
 * - ユーザー検索体験の向上
 * - フィルタ状態の永続化
 */

'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Period, SortType } from '@/app/types';

interface SearchFiltersProps {
  onFilterChange: (period: Period, sort: SortType) => void;
}

export default function SearchFilters({ 
  onFilterChange 
}: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // searchParams が null の場合のフォールバック
  const getQueryParam = (key: string, defaultValue: string): string => {
    return searchParams?.get(key) || defaultValue;
  };
  
  // URLクエリパラメータから初期値を取得、なければデフォルト値
  const initialSort = getQueryParam('sort', 'likes') as SortType;
  const initialPeriod = getQueryParam('period', 'day') as Period;

  const [sort, setSort] = useState<SortType>(initialSort);
  const [period, setPeriod] = useState<Period>(initialPeriod);

  // sort または period が変更されたらURLを更新し、親コンポーネントに通知
  useEffect(() => {
    // searchParams が null の場合は更新しない
    if (!searchParams) return; 

    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set('sort', sort);
    currentParams.set('period', period);
    // router.push はページ遷移を引き起こすため、replace を使用して履歴スタックに追加しないようにする
    router.replace(`/?${currentParams.toString()}`, { scroll: false }); 
    onFilterChange(period, sort);
  }, [sort, period, router, searchParams, onFilterChange]);

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSort(e.target.value as SortType);
  };

  const handlePeriodChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setPeriod(e.target.value as Period);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow">
      {/* ソート順 ドロップダウン */}
      <div className="flex-1">
        <label htmlFor="sort-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          ソート順
        </label>
        <select
          id="sort-select"
          name="sort"
          value={sort}
          onChange={handleSortChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="likes">いいね数</option>
          <option value="latest">最新順</option>
          <option value="trending">トレンド</option>
          <option value="combined">総合ランキング</option>
        </select>
      </div>
      
      {/* 期間 ドロップダウン */}
      <div className="flex-1">
        <label htmlFor="period-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          期間
        </label>
        <select
          id="period-select"
          name="period"
          value={period}
          onChange={handlePeriodChange}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="day">24時間</option>
          <option value="week">過去7日間</option>
          <option value="month">過去30日間</option>
          <option value="all">すべて</option>
        </select>
      </div>
    </div>
  );
}
