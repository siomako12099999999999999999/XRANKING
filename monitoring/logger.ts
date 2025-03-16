import winston from 'winston';
import { NextApiRequest, NextApiResponse } from 'next';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'xranking' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // 本番環境ではファイルへのログ記録も追加できます
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// API リクエストのログを記録するミドルウェア
export function loggerMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
}

export default logger;
