import { BigQuery } from '@google-cloud/bigquery';
import { log } from './logger.js';

//'postgres://postgres:postgres@localhost:5432/TootBack'

const registerStatus = (toots: Toot[], datasetId: string, tableId: string) => {
  const bigqueryClient = new BigQuery();
  log('I', `register ${toots.length} toots.`);
  return bigqueryClient
    .dataset(datasetId)
    .table(tableId)
    .insert(toots)
    .then(response => log('I', { msg: 'insert response', response: response }))
    .catch(response => log('E', { msg: 'insert error', response: response }))
    .then(_response => bigqueryClient.query('CALL tbds.register_bigram();'))
    .then(response => log('I', { msg: 'register_bigram response', response: response }))
    .catch(response => log('E', { msg: 'register_bigram error', response: response }));
};

interface Toot {
  instance: string;
  id: Number;
  created_at: string;
  content: string;
  status_json: string;
}
export { Toot, registerStatus };
