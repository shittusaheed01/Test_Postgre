import pino from 'pino';
import pinoHttp from 'pino-http';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { pid: process.pid },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: {
    paths: ['req.headers.authorization'],
    remove: true,
  },
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

// pino-http middleware
export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req(req) {
      return { url: req.url }; // only log the URL
    },
    res(res) {
      return { statusCode: res.statusCode }; // only log the status code
    },
  },
});
