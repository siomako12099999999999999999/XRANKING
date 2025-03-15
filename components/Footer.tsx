// components/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { FaTwitter } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-bold text-xl">
              XRANKING
            </div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              X / Twitter の人気動画投稿をランキング
            </p>
          </div>
          
          <div className="flex space-x-6">
            <a
              href="https://x.com/xranking32422"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
              aria-label="X (Twitter)"
            >
              <FaTwitter className="h-6 w-6" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <nav className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4 mb-4 md:mb-0">
              <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                このサイトについて
              </Link>
              <a 
                href="https://x.com/xranking32422"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                お問い合わせ
              </a>
            </nav>
            
            <p className="text-sm text-gray-500 dark:text-gray-500">
              &copy; {new Date().getFullYear()} XRANKING. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;