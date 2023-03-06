import { BigQuery } from '@google-cloud/bigquery';
import { log } from './logger.js';

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
  log('I', `register ${toots.length} toots.`);
  return bigqueryClient
    .dataset(datasetId)
    .table(toots_load)
    .insert(toots)
    .then(response => log('I', { msg: 'insert response', response: response }))
    .catch(response => log('E', { msg: 'insert error', response: response }));
};

interface Toot {
  instance: string;
  id: Number;
  created_at: string;
  content: string;
  status_json: string;
}
export { MaxIds, getMaxLoadedIds, Toot, registerStatus };
