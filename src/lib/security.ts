import crypto from 'crypto';
import { NextApiRequest, NextApiResponse } from 'next';

export function validateEnvVariables() {
  const requiredEnvVars = [
    'TWITTER_API_KEY',
    'TWITTER_API_SECRET',
    'DATABASE_URL',
    'NEXTAUTH_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

// グローバルなレート制限ストア
const rateLimitStore = new Map<string, number>();

export function rateLimitCheck(req: NextApiRequest, res: NextApiResponse): boolean {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const lastRequest = rateLimitStore.get(ip as string) || 0;
  
  // 1秒に1回までに制限
  if (now - lastRequest < 1000) {
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }
  
  rateLimitStore.set(ip as string, now);
  return true;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

export function sanitizeOutput(data: any): any {
  if (typeof data !== 'object' || data === null) return data;
  
  const sanitized = Array.isArray(data) ? [] : {};
  
  for (const [key, value] of Object.entries(data)) {
    if (key.toLowerCase().includes('password') || 
        key.toLowerCase().includes('secret') || 
        key.toLowerCase().includes('token')) {
      continue;
    }
    sanitized[key] = typeof value === 'object' ? sanitizeOutput(value) : value;
  }
  
  return sanitized;
}
