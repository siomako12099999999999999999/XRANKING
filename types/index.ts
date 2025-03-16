export type SortType = 'likes' | 'trending' | 'latest';
export type Period = 'day' | 'week' | 'month' | 'all';

export type OrderByInput = {
  [key in 'likes' | 'views' | 'timestamp']?: 'asc' | 'desc';
};