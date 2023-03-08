import { appMain } from './app.js';
import { logger } from './logger.js';
logger.info('tootback_batch start.');

await appMain(process.argv[2]);
