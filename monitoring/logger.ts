import winston from 'winston';
import { NextApiRequest, NextApiResponse } from 'next';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'xranking' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export function logApiRequest(req: NextApiRequest, res: NextApiResponse, duration: number) {
  logger.info({
    method: req.method,
    url: req.url,
    query: req.query,
    duration: `${duration}ms`,
    status: res.statusCode,
    userAgent: req.headers['user-agent']
  });
}

export function logError(error: Error, context?: any) {
  logger.error({
    message: error.message,
    stack: error.stack,
    context
  });
}

export default logger;
