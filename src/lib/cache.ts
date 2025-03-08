import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300, // 5分
  checkperiod: 60 
});

export function getCacheKey(prefix: string, params: Record<string, any>): string {
  return `${prefix}:${Object.values(params).join(':')}`;
}

export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached) return cached;

  const fresh = await fetchFn();
  cache.set(key, fresh);
  return fresh;
}

export default cache;
