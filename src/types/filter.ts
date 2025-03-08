export enum SortOption {
  Likes = 'likes',
  Retweets = 'retweets',
  Views = 'views',
  Date = 'date'
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export interface FilterOptions {
  sort: SortOption;
  direction: SortDirection;
  period: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  nextPage: number | null;
  total: number;
}