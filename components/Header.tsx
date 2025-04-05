/**
 * 機能概要：
 * アプリケーションのヘッダーコンポーネント
 * 
 * 主な機能：
 * 1. ナビゲーションの提供
 * 2. モバイルメニューの表示制御
 * 3. テーマ切り替え機能
 * 4. モバイルビューへの切り替え
 * 
 * 用途：
 * - アプリケーションのナビゲーション
 * - ブランディングの表示
 * - ユーザー設定へのアクセス
 * - レスポンシブデザイン対応
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { FaBars, FaTimes, FaTwitter, FaMobile, FaDownload } from 'react-icons/fa'; // FaDownload を追加
import { BiTrendingUp } from 'react-icons/bi';
import { BsPhone } from 'react-icons/bs';
import SearchFilters from './SearchFilters'; // SearchFilters コンポーネントをインポーネート
import LoadingSpinner from './LoadingSpinner'; // LoadingSpinner コンポーネントをインポート
import TweetList from './TweetList'; // TweetList コンポーネントをインポート
import Footer from './Footer'; // Footer コンポーネントをインポート
import { useQuery } from '@tanstack/react-query';

// 仮の useProxy フックを実装
const useProxy = false;
const toggleProxyUsage = () => {};

// 必要な状態や関数を宣言
const period = 'day'; // 仮の値を設定
const sort = 'likes'; // 仮の値を設定
const handleFilterChange = () => {}; // 仮の関数を定義
const tweets: any[] = []; // 仮のデータを設定
const error: Error | null = null; // 仮のエラーを設定
const hasNextPage = false; // 仮の値を設定
const handleLoadMore = () => {}; // 仮の関数を定義
const isFetchingNextPage = false; // 仮の値を設定

// ナビゲーション項目の型定義を追加
interface NavItem {
  path: string;
  name: string;
}

// HeaderProps は children を必要としないため削除

// 型を適用 (children を削除)
const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // ナビゲーション項目を定義 - モバイルナビゲーションで使用
  const navItems: NavItem[] = [
    // ナビゲーション項目が必要ない場合は空配列のままにする
  ];

  // アクティブなパスをチェックする関数を追加
  const isActive = (path: string): boolean => {
    return pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // 関数の定義を修正
  const goToMobileView = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent> | null = null, 
    specificSort?: string, 
    specificPeriod?: string
  ) => {
    // イベントが渡されていれば、デフォルトの動作を防止
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // URLSearchParamsを使って現在のクエリパラメータを取得
    const params = new URLSearchParams(window.location.search);
    
    // 特定のソート順や期間が指定されていれば優先、なければURLから取得、それもなければデフォルト値
    const currentSort = specificSort || params.get('sort') || 'likes';
    const currentPeriod = specificPeriod || params.get('period') || 'week';
    
    // クエリパラメータ付きでモバイルページに遷移
    router.push(`/mobile?sort=${currentSort}&period=${currentPeriod}`);
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2 text-xl font-bold text-blue-600 dark:text-blue-400">
              <BiTrendingUp className="h-6 w-6" />
              <span>XRANKING</span>
            </Link>
          </div>

          {/* Desktop Navigation - 削除してシンプルな右側のアイコン群のみに */}
          <div className="flex items-center space-x-4">
            {/* Download Link */}
            <Link
              href="/download"
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1"
              aria-label="動画ダウンロード"
              title="動画ダウンロード" // Add title for tooltip
            >
              <FaDownload className="h-5 w-5" />
            </Link>

            <button
              onClick={() => goToMobileView(null)}
              className="text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-1"
              aria-label="モバイルビュー"
            >
              <FaMobile className="h-5 w-5" />
            </button>
            
            <ThemeToggle />
            
            <a 
              href="https://x.com/xranking32422" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              aria-label="X (Twitter)"
            >
              <FaTwitter className="h-5 w-5" />
            </a>
            
            <button
              className="md:hidden text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <nav className="container mx-auto px-4 py-2">
            <ul className="space-y-2">
              {navItems.map((item: NavItem) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`block py-2 text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400
                      ${isActive(item.path) 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300'}`}
                    onClick={closeMenu}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
      {/* Header内にメインコンテンツ(children)は不要なため削除 */}
    </header>
  );
};

export default Header;
