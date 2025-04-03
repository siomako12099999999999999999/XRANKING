/**
 * 機能概要：
 * Tailwind CSSの設定ファイル
 * 
 * 主な機能：
 * 1. コンテンツパスの設定
 * 2. ダークモードの設定
 * 3. カスタムアニメーションの定義
 * 4. テーマの拡張設定
 * 
 * 用途：
 * - スタイリングの一元管理
 * - レスポンシブデザインの実装
 * - カスタムコンポーネントのスタイリング
 * - アニメーション効果の定義
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        'loader-dot1': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
        },
        'loader-dot2': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
          '0%, 15%': { transform: 'scale(1)', opacity: '1' }, 
        },
        'loader-dot3': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.5)', opacity: '0.5' },
          '0%, 30%': { transform: 'scale(1)', opacity: '1' }, 
        },
        'loader-bounce1': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        'loader-bounce2': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '0%, 10%': { transform: 'translateY(0)' }
        },
        'loader-bounce3': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
          '0%, 20%': { transform: 'translateY(0)' }
        },
        'loader-bar': {
          '0%': { width: '0%' },
          '50%': { width: '70%' },
          '100%': { width: '100%' }
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.3' },
        },
      },
      animation: {
        'loader-dot1': 'loader-dot1 1.4s infinite ease-in-out',
        'loader-dot2': 'loader-dot2 1.4s infinite ease-in-out 0.2s',
        'loader-dot3': 'loader-dot3 1.4s infinite ease-in-out 0.4s',
        'loader-bounce1': 'loader-bounce1 1.2s infinite',
        'loader-bounce2': 'loader-bounce2 1.2s infinite 0.2s',
        'loader-bounce3': 'loader-bounce3 1.2s infinite 0.4s',
        'loader-bar': 'loader-bar 2s infinite ease-in-out',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'pulse': 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  variants: {
    extend: {
      // バリアントの拡張（オプション）
    },
  },
  plugins: [],
}