'use client';

import { FilterOptions, SortOption, SortDirection } from '@/types/filter';

interface TweetFilterProps {
  filter: FilterOptions;
  onFilterChange: (filter: FilterOptions) => void;
}

export default function TweetFilter({ filter, onFilterChange }: TweetFilterProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow">
      <select
        className="px-4 py-2 border rounded-md"
        value={filter.sort}
        onChange={(e) =>
          onFilterChange({ ...filter, sort: e.target.value as SortOption })
        }
      >
        <option value={SortOption.Likes}>いいね数</option>
        <option value={SortOption.Retweets}>リツイート数</option>
        <option value={SortOption.Views}>視聴回数</option>
        <option value={SortOption.Date}>投稿日時</option>
      </select>

      <select
        className="px-4 py-2 border rounded-md"
        value={filter.direction}
        onChange={(e) =>
          onFilterChange({ ...filter, direction: e.target.value as SortDirection })
        }
      >
        <option value={SortDirection.Desc}>降順</option>
        <option value={SortDirection.Asc}>昇順</option>
      </select>

      <select
        className="px-4 py-2 border rounded-md"
        value={filter.period}
        onChange={(e) =>
          onFilterChange({ ...filter, period: e.target.value })
        }
      >
        <option value="24h">24時間</option>
        <option value="7d">7日間</option>
        <option value="30d">30日間</option>
        <option value="all">全期間</option>
      </select>
    </div>
  );
}