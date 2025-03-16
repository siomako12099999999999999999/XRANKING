import React from 'react';
import Link from 'next/link';
import { BsPhone } from 'react-icons/bs';
import { useSearchParams } from 'next/navigation';
import styles from './MobileViewBanner.module.css';

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
        <BsPhone className="h-4 w-4" />
        <span className="font-medium text-sm">モバイル版を表示</span>
      </Link>
    </div>
  );
};

export default MobileViewBanner;