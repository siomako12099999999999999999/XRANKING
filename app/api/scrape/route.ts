import { NextRequest, NextResponse } from 'next/server'; // Import NextRequest
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) { // Add request parameter
  console.log('Scraping API endpoint called');

  let query: string | undefined;
  let limit: number | undefined;

  try {
    const body = await request.json();
    query = body.query;
    limit = body.limit;
    console.log(`Received scrape request with query: ${query}, limit: ${limit}`);
  } catch (error) {
    console.error('Failed to parse request body:', error);
    return NextResponse.json({ success: false, message: 'リクエストボディの解析に失敗しました。' }, { status: 400 });
  }

  if (!query) {
    return NextResponse.json({ success: false, message: '検索キーワードが必要です。' }, { status: 400 });
  }

  // Pythonスクリプトのパスをプロジェクトルートからの相対パスで指定
  // process.cwd() はプロジェクトのルートディレクトリを指す想定
  const scriptPath = path.join(process.cwd(), 'twitter_video_search.py');
  const args: string[] = [scriptPath, query]; // Add query as positional argument

  if (limit !== undefined && !isNaN(limit)) {
    args.push('--limit', String(limit)); // Add limit as option if provided
  }
  // Add other necessary arguments like --save if needed by default
  args.push('--save'); // Assuming we always want to save results

  console.log(`Attempting to execute script: python ${args.join(' ')}`);

  return new Promise((resolve) => {
    // Set PYTHONIOENCODING to utf-8 for the spawned process
    const pythonProcess = spawn('python', args, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python script exited with code ${code}`); // 終了コードログ
      if (code === 0) {
        resolve(NextResponse.json({ success: true, message: 'スクレイピングが正常に開始されました。', output: stdout }));
      } else {
        resolve(NextResponse.json({ success: false, message: `スクレイピングの開始に失敗しました。エラーコード: ${code}`, error: stderr }, { status: 500 }));
      }
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start subprocess.', err); // プロセス開始エラーログ
      resolve(NextResponse.json({ success: false, message: 'スクレイピングプロセスの開始に失敗しました。', error: err.message }, { status: 500 }));
    });
  });
}
