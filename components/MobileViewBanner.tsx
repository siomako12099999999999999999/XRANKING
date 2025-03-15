import React from 'react';
import Link from 'next/link';
import { BsMobileAlt } from 'react-icons/bs';
import { useSearchParams } from 'next/navigation';

/* ヘッダーのスクロールバーを非表示にするスタイル */
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer と Edge 用 */
    scrollbar-width: none;  /* Firefox 用 */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera 用 */
  }
}

const MobileViewBanner = () => {
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') || 'likes';
  const period = searchParams.get('period') || 'week';

  return (
    <div className="fixed bottom-4 right-4 md:hidden z-40">
      <Link 
        href={`/mobile?sort=${sort}&period=${period}`}
        className="bg-blue-600 text-white rounded-full flex items-center space-x-2 px-4 py-2 shadow-lg"
      >
        <BsMobileAlt className="h-4 w-4" />
        <span className="font-medium text-sm">モバイル版を表示</span>
      </Link>
    </div>
  );
};

export default MobileViewBanner;