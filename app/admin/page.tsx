"use client"; // Add this directive

import React, { useState, useEffect } from 'react';

// Define the type for a video object based on the API response
interface VideoData {
  id: string;
  content: string | null;
  videoUrl: string | null;
  views: number;
  authorName: string | null;
  authorUsername: string | null;
  timestamp: string; // Assuming timestamp is returned as a string
}

const AdminPage = () => {
  const [scrapeLoading, setScrapeLoading] = useState(false);
  const [scrapeMessage, setScrapeMessage] = useState('');
  const [scrapeError, setScrapeError] = useState('');
  const [scrapeOutput, setScrapeOutput] = useState(''); // State for stdout display
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState<number | string>(10);

  const [videos, setVideos] = useState<VideoData[]>([]);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState('');

  // State for table clear operation
  const [clearLoading, setClearLoading] = useState(false);
  const [clearMessage, setClearMessage] = useState('');
  const [clearError, setClearError] = useState('');

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(true); // Start in authenticating state

  // Function to handle password submission
  const handlePasswordSubmit = async (password: string) => {
    setAuthError('');
    try {
      const response = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('isAdminAuthenticated', 'true'); // Store auth status in session storage
      } else {
        setAuthError(data.message || '認証に失敗しました。');
        sessionStorage.removeItem('isAdminAuthenticated');
      }
    } catch (err) {
      setAuthError('認証リクエスト中にエラーが発生しました。');
      sessionStorage.removeItem('isAdminAuthenticated');
    }
  };

  // Check authentication status on initial load and prompt if needed
  useEffect(() => {
    const checkAuth = async () => {
      // Check session storage first
      if (sessionStorage.getItem('isAdminAuthenticated') === 'true') {
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        return;
      }

      // If not in session storage, prompt for password
      const enteredPassword = prompt('管理者パスワードを入力してください:');
      if (enteredPassword === null) { // User cancelled prompt
        setAuthError('認証がキャンセルされました。');
        setIsAuthenticating(false);
      } else if (enteredPassword) {
        await handlePasswordSubmit(enteredPassword);
        setIsAuthenticating(false);
      } else { // User entered empty password
        setAuthError('パスワードを入力してください。');
        setIsAuthenticating(false);
      }
    };
    checkAuth();
  }, []); // Run only once on mount

  const handleScrapeClick = async () => {
    if (!query) {
      setScrapeError('検索キーワードを入力してください。');
      return;
    }
    setScrapeLoading(true);
    setScrapeMessage('');
    setScrapeError('');
    setScrapeOutput(''); // Clear previous output
    console.log(`Sending request to /api/scrape with query: ${query}, limit: ${limit}`);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, limit: Number(limit) || undefined }), // Send query and limit
      });
      const data = await response.json();
      console.log('Received response:', data);

      if (response.ok && data.success) {
        setScrapeMessage(data.message || 'スクレイピングが正常に完了しました。');
        setScrapeOutput(data.output || ''); // Set the output state
      } else {
        setScrapeError(data.message || data.error || 'スクレイピングの実行に失敗しました。');
        setScrapeOutput(data.output || data.error || ''); // Show output/error even on failure
      }
    } catch (err) {
      console.error('Scraping request failed:', err); // フロントエンドログ
      setScrapeError(`リクエスト中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setScrapeLoading(false);
    }
  };

  // Function to handle table clear
  const handleClearTable = async () => {
    if (!window.confirm('本当にTweetテーブルの全データを削除しますか？この操作は元に戻せません。')) {
      return;
    }
    setClearLoading(true);
    setClearMessage('');
    setClearError('');
    console.log('Sending request to /api/tweets/clear');

    try {
      const response = await fetch('/api/tweets/clear', {
        method: 'DELETE',
      });
      const data = await response.json();
      console.log('Received clear response:', data);

      if (response.ok && data.success) {
        setClearMessage(data.message || 'テーブルをクリアしました。');
        // Optionally refresh video list after clearing
        // fetchVideos(); // Uncomment if you want to refresh the list immediately
      } else {
        setClearError(data.message || data.error || 'テーブルのクリアに失敗しました。');
      }
    } catch (err) {
      console.error('Clear table request failed:', err);
      setClearError(`リクエスト中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setClearLoading(false);
    }
  };


  useEffect(() => {
    const fetchVideos = async () => {
      setVideoLoading(true);
      setVideoError('');
      console.log('Fetching videos from /api/videos'); // フロントエンドログ
      try {
        const response = await fetch('/api/videos');
        const data = await response.json();
        console.log('Received video data:', data); // フロントエンドログ

        if (response.ok && data.success) {
          setVideos(data.videos);
        } else {
          setVideoError(data.message || data.error || '動画データの取得に失敗しました。');
        }
      } catch (err) {
        console.error('Failed to fetch videos:', err); // カンマを追加
        setVideoError(`動画データの取得中にエラーが発生しました: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setVideoLoading(false);
      }
    };

    fetchVideos();
  }, [isAuthenticated]); // Re-fetch videos if authentication status changes (e.g., after successful login)

  // Return statement should be outside useEffect

  // Render based on authentication state
  if (isAuthenticating) {
    return <div className="flex justify-center items-center h-screen"><p>認証中...</p></div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h1 className="text-2xl font-bold mb-4 text-red-600">アクセス拒否</h1>
        <p className="mb-4">{authError || 'このページにアクセスするには認証が必要です。'}</p>
        <button
          onClick={() => window.location.reload()} // Simple way to re-trigger prompt
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          再試行
        </button>
      </div>
    );
  }

  // Render admin content if authenticated
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">管理者画面</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">動画閲覧数</h2>
        {videoLoading && <p>動画データを読み込み中...</p>}
        {videoError && <p className="text-red-600">{videoError}</p>}
        {!videoLoading && !videoError && videos.length === 0 && <p>表示する動画データがありません。</p>}
        {!videoLoading && !videoError && videos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">投稿者</th>
                  <th className="py-2 px-4 border-b text-left">内容</th>
                  <th className="py-2 px-4 border-b text-right">閲覧数</th>
                  <th className="py-2 px-4 border-b text-left">動画リンク</th>
                  <th className="py-2 px-4 border-b text-left">投稿日時</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-50">
                    <td className="py-2 px-4 border-b">{video.authorName || video.authorUsername || 'N/A'}</td>
                    <td className="py-2 px-4 border-b max-w-xs truncate">{video.content || 'N/A'}</td>
                    <td className="py-2 px-4 border-b text-right">{video.views.toLocaleString()}</td>
                    <td className="py-2 px-4 border-b">
                      {video.videoUrl ? (
                        <a href={video.videoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          動画を見る
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">{new Date(video.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">X スクレイピング</h2>
        <div className="mb-4 space-y-2">
          <div>
            <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-1">
              検索キーワード:
            </label>
            <input
              type="text"
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="例: #プログラミング"
              required
            />
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              取得上限数 (任意):
            </label>
            <input
              type="number"
              id="limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded"
              placeholder="デフォルト: 10"
              min="1"
            />
          </div>
        </div>
        <button
          className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${scrapeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleScrapeClick}
          disabled={scrapeLoading}
        >
          {scrapeLoading ? '実行中...' : 'スクレイピング実行'}
        </button>
        {/* Status Messages */}
        {scrapeLoading && <p className="mt-2 text-blue-600">スクレイピング処理を実行中です...</p>}
        {scrapeMessage && !scrapeLoading && <p className="mt-2 text-green-600">{scrapeMessage}</p>}
        {scrapeError && !scrapeLoading && <p className="mt-2 text-red-600">エラー: {scrapeError}</p>}

        {/* Output Display Area */}
        {scrapeOutput && (
          <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded max-h-60 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">実行ログ:</h3>
            <pre className="text-sm whitespace-pre-wrap break-words">
              {scrapeOutput}
            </pre>
          </div>
        )}
      </section>

      <section className="mt-8 border-t pt-8">
        <h2 className="text-xl font-semibold mb-2 text-red-600">危険ゾーン</h2>
        <p className="text-sm text-gray-600 mb-4">以下の操作は元に戻せません。注意して実行してください。</p>
        <button
          className={`bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-4 rounded ${clearLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleClearTable}
          disabled={clearLoading}
        >
          {clearLoading ? 'クリア中...' : 'Tweetテーブルクリア'}
        </button>
        {/* Clear Status Messages */}
        {clearLoading && <p className="mt-2 text-blue-600">テーブルデータをクリア中です...</p>}
        {clearMessage && !clearLoading && <p className="mt-2 text-green-600">{clearMessage}</p>}
        {clearError && !clearLoading && <p className="mt-2 text-red-600">エラー: {clearError}</p>}
      </section>
    </div>
  );
};

export default AdminPage;
