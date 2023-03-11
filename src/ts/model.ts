import { BigQuery } from '@google-cloud/bigquery';
import { logger } from './logger.js';

interface MaxIds {
  instance: string;
  id: Number;
}
const getMaxLoadedIds = (runIntervalMinutes: number) => {
  const query = `
SELECT 
  instance, 
  MAX(id) id
FROM tootback.tbds.toots_bigram
WHERE TIMESTAMP_SUB(current_timestamp(), INTERVAL ${runIntervalMinutes + 1} MINUTE) < created_at
GROUP BY instance
  `;

  return new BigQuery().query({ query: query }).then(response => response[0]?.map(d => d as MaxIds));
};

const registerStatus = (toots: Toot[]) => {
  logger.info(`register ${toots.length} toots to toots_load.`, { tootsCount: toots.length });
  const bigqueryClient = new BigQuery();
  return bigqueryClient
    .dataset('tbds')
    .table('toots_load')
    .insert(toots)
    .then(response => logger.info('insert response', { response }))
    .catch(response => logger.error('insert error', { response }))
    .then(_response => bigqueryClient.query('CALL tbds.register_bigram();'))
    .then(response => logger.info('register_bigram response', { response }))
    .catch(response => logger.error('register_bigram error', { response }));
};

interface Toot {
  instance: string;
  id: number;
  created_at: string;
  content: string;
  status_json: string;
}

export { MaxIds, getMaxLoadedIds, Toot, registerStatus };
