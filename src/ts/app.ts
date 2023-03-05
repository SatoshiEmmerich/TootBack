import { login, mastodon } from 'masto';
import { stripHtml } from 'string-strip-html';
import moment from 'moment';
import * as fs from 'fs/promises';
import * as model from './model.js';
import { Config } from './config.js';
import { log } from './logger.js';
log('I', 'tootback_batch start.');

type Status = mastodon.v1.Status;

const statusToString = (s: Status, instance: string) =>
  [
    `[${(instance + ' '.repeat(8)).substring(0, 8)}]`,
    moment(s.createdAt).format('hh:mm:ss'),
    // s.id,
    s.account.displayName,
    stripHtml(s.content).result.substring(0, 15),
  ].join(' ');

const statusToToot = (s: Status, instance: string) =>
  <model.Toot>{
    instance: instance,
    id: Number.parseInt(s.id),
    created_at: moment(s.createdAt).format('YYYY-MM-DD hh:mm:ss.SSS'),
    content: stripHtml(s.content).result,
    status_json: JSON.stringify(s),
  };

const appMain = (confFile: string) =>
  fs
    .readFile(confFile)
    .then(configBuffer => {
      const config = JSON.parse(configBuffer.toString()) as Config;
      return Promise.all(
        config.instances.map(instance =>
          login({ url: instance.url })
            .then(client =>
              client.v1.timelines.listPublic({
                local: true,
                limit: config.maxFetchCount,
              })
            )
            .then(selected => {
              if (process.env.TOOTBACK_IS_LOCAL) {
                selected.forEach(s => log('I', statusToString(s, instance.name)));
              }
              return selected.map(s => statusToToot(s, instance.name));
            })
        )
      ).then(toots => model.registerStatus(toots.flat(), config.bigquery.datasetId, config.bigquery.tableId));
    })
    .catch(e => log('E', e));

export { appMain };
