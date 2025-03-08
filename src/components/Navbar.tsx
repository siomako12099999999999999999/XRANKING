'use client'

import { MoonIcon, SunIcon } from '@radix-ui/react-icons'
import { useTheme } from 'next-themes'
import styles from '../styles/Navbar.module.css';

type Period = '24h' | 'week' | 'month' | 'all';

interface NavbarProps {
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
}

export default function Navbar({ currentPeriod, onPeriodChange }: NavbarProps) {
  const { theme, setTheme } = useTheme()

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <span className="font-bold">X Ranking</span>
          </a>
          <div className={styles.periods}>
            <button 
              className={`${styles.periodButton} ${currentPeriod === '24h' ? styles.active : ''}`}
              onClick={() => onPeriodChange('24h')}
            >
              24時間
            </button>
            <button 
              className={`${styles.periodButton} ${currentPeriod === 'week' ? styles.active : ''}`}
              onClick={() => onPeriodChange('week')}
            >
              週間
            </button>
            <button 
              className={`${styles.periodButton} ${currentPeriod === 'month' ? styles.active : ''}`}
              onClick={() => onPeriodChange('month')}
            >
              月間
            </button>
            <button 
              className={`${styles.periodButton} ${currentPeriod === 'all' ? styles.active : ''}`}
              onClick={() => onPeriodChange('all')}
            >
              総合
            </button>
          </div>
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="rounded-md p-2 hover:bg-accent"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </nav>
  )
}
