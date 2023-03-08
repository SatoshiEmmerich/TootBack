import { BigQuery } from '@google-cloud/bigquery';
import { logger } from './logger.js';

const toots_load = 'toots_load';

interface MaxIds {
  instance: string;
  id: Number;
}
const getMaxLoadedIds = (datasetId: string) => {
  const query = `
SELECT 
  instance, 
  MAX(id) id
FROM tootback.tbds.toots_bigram
WHERE TIMESTAMP_SUB(current_timestamp(), INTERVAL 5 MINUTE) < created_at
GROUP BY instance
  `;

  return new BigQuery().query({ query: query }).then(response => response[0]?.map(d => d as MaxIds));
};

const registerStatus = (toots: Toot[], datasetId: string) => {
  const bigqueryClient = new BigQuery();
  logger.info(`register ${toots.length} toots.`);
  return bigqueryClient
    .dataset(datasetId)
    .table(toots_load)
    .insert(toots)
    .then(response => logger.info({ msg: 'insert response', response: response }))
    .catch(response => logger.error({ msg: 'insert error', response: response }))
    .then(_response => bigqueryClient.query('CALL tbds.register_bigram();'))
    .then(response => logger.info({ msg: 'register_bigram response', response: response }))
    .catch(response => logger.error({ msg: 'register_bigram error', response: response }));
};

interface Toot {
  instance: string;
  id: Number;
  created_at: string;
  content: string;
  status_json: string;
}

export { MaxIds, getMaxLoadedIds, Toot, registerStatus };
