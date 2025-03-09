// formatNumber関数を更新
export function formatNumber(num: number | string | bigint | undefined | null): string {
  if (num === undefined || num === null) return '0';
  
  // 文字列や数値以外の型を数値に変換
  const value = typeof num === 'string' ? parseFloat(num) : Number(num);
  
  if (isNaN(value)) return '0';
  
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toString();
}

export function formatDate(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds}秒前`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}時間前`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays}日前`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}ヶ月前`;
  }
  
  return `${Math.floor(diffInMonths / 12)}年前`;
}

/**
 * 日付オブジェクトを含むデータをシリアライズして返す
 */
export function serializeDates(data: any): any {
  if (data === null || data === undefined) return data;
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeDates(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = serializeDates(data[key]);
      }
    }
    return result;
  }
  
  return data;
}