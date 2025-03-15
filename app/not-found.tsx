import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-5xl font-bold mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-6">ページが見つかりません</h2>
      <p className="text-lg mb-8 max-w-md text-gray-700 dark:text-gray-300">
        お探しのページは存在しないか、移動された可能性があります。
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors"
      >
        ホームに戻る
      </Link>
    </div>
  );
}