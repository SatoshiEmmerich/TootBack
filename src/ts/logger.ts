import crypto from 'crypto';
import * as winston from 'winston';

/** execution id */
const rand = crypto.randomBytes(20).toString('hex').substring(0, 6);

const labels = winston.format(info => {
  info['logging.googleapis.com/labels'] = { execId: rand };
  return info;
});

const severity = winston.format(info => {
  info['severity'] = info.level.toUpperCase();
  return info;
});

const errorReport = winston.format(info => {
  if (info instanceof Error) {
    info.err = {
      name: info.name,
      message: info.message,
      stack: info.stack,
    };
  } else if (info.level === 'error') {
    info['@type'] = 'type.googleapis.com/google.devtools.clouderrorreporting.v1beta1.ReportedErrorEvent';
  }
  // required to report logged errors to the Error Reporting console
  info['serviceContext'] = {
    service: 'tootback_batch',
    version: '0.1',
  };
  return info;
});

const logger = winston.createLogger({
  format: winston.format.combine(labels(), severity(), errorReport(), winston.format.json()),
  transports: [new winston.transports.Console({ level: 'info' })],
});

// when launched locally
if (process.env.TOOTBACK_IS_LOCAL) {
  // clear transport
  logger.clear();
  const fileLoggerOptions = {
    level: 'debug',
    filename: 'batch.log',
    // flags: rewrite file
    options: { flags: 'w' },
  };
  logger.add(new winston.transports.File(fileLoggerOptions));
}
export { logger };
