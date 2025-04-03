import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

// IMPORTANT: Add authentication/authorization check here in a real application
// For now, we assume this endpoint is only called from the authenticated admin page.

export async function DELETE() {
  console.log('API endpoint /api/tweets/clear called - executing batch file');
  const batchFilePath = path.join(process.cwd(), 'clear_tweets.bat');
  console.log(`Attempting to execute batch file at: ${batchFilePath}`);

  return new Promise((resolve) => {
    // Execute the batch file
    // Use { shell: true } on Windows to properly execute .bat files
    const process = spawn(batchFilePath, [], { shell: true });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Batch stdout: ${output}`);
      stdout += output;
    });

    process.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.error(`Batch stderr: ${errorOutput}`);
      stderr += errorOutput;
    });

    process.on('close', (code) => {
      console.log(`Batch file exited with code ${code}`);
      if (code === 0) {
        // Extract success message from stdout if possible, otherwise use a generic one
        const successMatch = stdout.match(/✅ 成功: (\d+) 件のデータを削除しました。/);
        const message = successMatch ? successMatch[0] : 'テーブルクリア処理が完了しました。';
        resolve(NextResponse.json({ success: true, message: message, output: stdout }));
      } else {
        // Extract error message from stderr or stdout if possible
        const errorMatch = stderr.match(/❌ (.+)/) || stdout.match(/❌ (.+)/);
        const errorMessage = errorMatch ? errorMatch[1] : 'テーブルクリア処理に失敗しました。';
        resolve(NextResponse.json({ success: false, message: errorMessage, error: stderr || stdout }, { status: 500 }));
      }
    });

    process.on('error', (err) => {
      console.error('Failed to start batch process.', err);
      resolve(NextResponse.json({ success: false, message: 'テーブルクリア処理の開始に失敗しました。', error: err.message }, { status: 500 }));
    });
  });
}
