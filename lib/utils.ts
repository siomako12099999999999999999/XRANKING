/**
 * 機能概要：
 * 汎用ユーティリティ関数群
 * 
 * 主な機能：
 * 1. 数値のフォーマット（K, Mなどのサフィックス付き）
 * 2. 日付の相対表示や標準フォーマット
 * 3. 日付型を含むデータのシリアライズ
 * 4. データ変換ユーティリティ
 * 
 * 用途：
 * - UI表示の最適化
 * - データの標準化
 * - API互換性の確保
 * - 共通処理の一元管理
 */

// 数値のフォーマット（K, Mなどのサフィックス付き）
export function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// 日付のフォーマット
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // 1日以内
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours === 0) {
      const minutes = Math.floor(diff / (60 * 1000));
      if (minutes === 0) {
        return '数秒前';
      }
      return `${minutes}分前`;
    }
    return `${hours}時間前`;
  }
  
  // 7日以内
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}日前`;
  }
  
  // それ以外
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
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