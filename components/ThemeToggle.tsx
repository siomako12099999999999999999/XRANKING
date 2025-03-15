'use client';

import { useState, useEffect } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  // テーマの状態
  const [darkMode, setDarkMode] = useState(false);

  // コンポーネントがマウントされたときにローカルストレージから設定を読み込む
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // ローカルストレージの設定を確認
      const savedTheme = localStorage.getItem('theme');
      
      // システム設定またはローカルストレージの設定に基づいて初期テーマを設定
      const isDark = 
        savedTheme === 'dark' || 
        (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setDarkMode(isDark);
      
      // HTML要素にクラスを適用
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  // テーマを切り替える関数
  const toggleTheme = () => {
    setDarkMode(!darkMode);
    
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
      aria-label={darkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
    >
      {darkMode ? (
        <FaSun className="h-5 w-5" />
      ) : (
        <FaMoon className="h-5 w-5" />
      )}
    </button>
  );
};

export default ThemeToggle;