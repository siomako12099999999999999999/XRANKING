import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable is not set.');
    return NextResponse.json({ success: false, message: 'サーバー設定エラー' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ success: false, message: 'パスワードが必要です。' }, { status: 400 });
    }

    if (password === adminPassword) {
      // パスワードが一致した場合、成功レスポンスを返す
      // セキュリティ向上のため、セッションやトークンベースの認証を検討することもできます
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: 'パスワードが違います。' }, { status: 401 });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return NextResponse.json({ success: false, message: '認証処理中にエラーが発生しました。' }, { status: 500 });
  }
}
