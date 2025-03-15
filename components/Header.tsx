'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { FaBars, FaTimes, FaTwitter, FaMobile } from 'react-icons/fa'; // FaMobileを追加
import { BiTrendingUp } from 'react-icons/bi';
import { BsPhone } from 'react-icons/bs';
import SearchFilters from './SearchFilters'; // SearchFilters コンポーネントをインポーネート
import LoadingSpinner from './LoadingSpinner'; // LoadingSpinner コンポーネントをインポート
import TweetList from './TweetList'; // TweetList コンポーネントをインポート
import Footer from './Footer'; // Footer コンポーネントをインポート

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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

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
              {navItems.map((item) => (
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
    </header>
  );
};

export default Header;

// app/page.tsx のレイアウト部分を改善
<main className="min-h-screen bg-gray-50 dark:bg-gray-900">
  <Header />
  
  <div className="container mx-auto px-4 py-8">
    <div className="mb-8 text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        XRANKING
        <span className="block text-lg font-normal text-gray-600 dark:text-gray-300 mt-2">
          人気の動画投稿をチェック
        </span>
      </h1>
    </div>

    <div className="flex flex-col lg:flex-row gap-6">
      {/* サイドバー: デスクトップでは左側に表示 */}
      <div className="lg:w-1/4">
        <div className="sticky top-24 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text白">絞り込み検索</h2>
          <SearchFilters 
            initialPeriod={period as any} 
            initialSort={sort as any}
            onFilterChange={handleFilterChange}
          />
          
          {/* プロキシ切り替えはデバッグパネルとして下部に配置 */}
          <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">詳細設定</h3>
            <div className="flex items-center">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={useProxy}
                  onChange={toggleProxyUsage}
                />
                <div className="relative w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                  動画プロキシ使用
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* メインコンテンツ */}
      <div className="lg:w-3/4">
        {status === 'pending' ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner size="h-12 w-12" />
          </div>
        ) : status === 'error' ? (
          <div className="text-center py-10 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text白 mb-2">エラーが発生しました</h2>
            <p className="text-red-600 dark:text-red-400">{(error as unknown as Error).message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              再読み込み
            </button>
          </div>
        ) : tweets.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-1">条件に一致する投稿がありません</h2>
            <p className="text-gray-500 dark:text-gray-400">検索条件を変更して再試行してください</p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/20">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <span className="font-medium">{tweets.length}件</span>の動画投稿を表示中
                </p>
              </div>
            </div>
            
            <TweetList tweets={tweets} useProxy={useProxy} />
            
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetchingNextPage}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-sm hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200"
                >
                  {isFetchingNextPage ? (
                    <span className="flex items-center justify-center">
                      <LoadingSpinner size="h-5 w-5" />
                      <span className="ml-2">読み込み中...</span>
                    </span>
                  ) : (
                    'もっと見る'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
  
  <Footer />
</main>