import pino from "pino";

const isDev = process.env.NODE_ENV !== 'production';

const log = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: {
    targets: [
      ...(isDev ? [{
        target: "pino-pretty",
        level: isDev ? "debug" : "info",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }] : []),
      {
        target: "pino/file",
        level: "info",
        options: { destination: "./logs/app.log", mkdir: true },
      },
    ],
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "*.passwordHash",
      "*.password",
      "*.key_secret",
      "*.webhook_secret",
    ],
    censor: '[REDACTED]',
  },
  base: {
    env: process.env.NODE_ENV,
    service: 'Payment-service'
  }
});

export default log;
