import { BigQuery } from '@google-cloud/bigquery';
import { log } from './logger.js';

//'postgres://postgres:postgres@localhost:5432/TootBack'

const registerStatus = (toots: Toot[], datasetId: string, tableId: string) => {
  const bigqueryClient = new BigQuery();
  return bigqueryClient
    .dataset(datasetId)
    .table(tableId)
    .insert(toots)
    .then(response => {
      // bi-gram を更新する
      bigqueryClient.query('CALL tbds.register_bigram();');
    })
    .catch(reason => {
      log('E', JSON.stringify(reason, null, '  '));
    });
};

interface Toot {
  instance: string;
  id: Number;
  created_at: string;
  content: string;
  status_json: string;
}
export { Toot, registerStatus };
