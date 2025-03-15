'use client';

import React from 'react';
import { BiTrendingUp } from 'react-icons/bi';
import { BsPhone } from 'react-icons/bs';
import { FaChevronLeft, FaHeart, FaBolt, FaClock } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface MobileHeaderProps {
  currentSort: string;
  currentPeriod: string;
  onSortChange: (sort: string) => void;
  onPeriodChange: (period: string) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentSort,
  currentPeriod,
  onSortChange,
  onPeriodChange
}) => {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/');
  };

  // ソートオプションと対応するアイコン
  const sortOptions = [
    { id: 'likes', name: 'いいね', icon: <FaHeart className="h-3 w-3 mr-1" /> },
    { id: 'trending', name: 'トレンド', icon: <FaBolt className="h-3 w-3 mr-1" /> },
    { id: 'latest', name: '最新', icon: <FaClock className="h-3 w-3 mr-1" /> }
  ];

  return (
    <div className="bg-black bg-opacity-75 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
      <div className="px-4 py-2 flex flex-col">
        {/* ロゴとブランド */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <button
              onClick={handleGoHome}
              className="text-white p-1 rounded-full mr-2"
              aria-label="戻る"
            >
              <FaChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center space-x-1 text-white">
              <BiTrendingUp className="h-5 w-5 text-blue-500" />
              <span className="font-bold text-lg">XRANKING</span>
              <BsPhone className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          
          {/* 現在の期間表示 */}
          <div className="bg-gray-800 rounded-full px-2 py-0.5 text-xs text-white">
            {currentPeriod === 'day' ? '今日' : 
             currentPeriod === 'week' ? '週間' : '月間'}
          </div>
        </div>
        
        {/* ソート順タブ */}
        <div className="flex justify-between items-center border-b border-gray-800">
          {sortOptions.map(option => (
            <button
              key={option.id}
              onClick={() => onSortChange(option.id)}
              className={`flex items-center px-2 py-2 text-sm ${
                currentSort === option.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400'
              }`}
              aria-label={`${option.name}順に表示`}
            >
              {option.icon}
              {option.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileHeader;