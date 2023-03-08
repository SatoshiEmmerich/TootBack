import { login, mastodon } from 'masto';
import { stripHtml } from 'string-strip-html';
import moment from 'moment';
import * as fs from 'fs/promises';
import * as model from './model.js';
import { Config } from './config.js';
import { logger } from './logger.js';

type Status = mastodon.v1.Status;

const statusToString = (s: Status, instance: string) =>
  [
    `[${(instance + ' '.repeat(8)).substring(0, 8)}]`,
    moment(s.createdAt).format('hh:mm:ss'),
    s.account.displayName,
    stripHtml(s.content).result.substring(0, 20),
  ].join(' ');

const statusToToot = (s: Status, instance: string) =>
  <model.Toot>{
    instance: instance,
    id: Number.parseInt(s.id),
    created_at: moment(s.createdAt).utc().format('YYYY-MM-DD HH:mm:ss.SSS UTC'),
    content: stripHtml(s.content).result,
    status_json: JSON.stringify(s),
  };

const appMain = (confFile: string) =>
  fs
    .readFile(confFile)
    .then(configBuffer => {
      const config = JSON.parse(configBuffer.toString()) as Config;
      const datasetId = config.bigquery.datasetId;
      return model
        .getMaxLoadedIds(datasetId)
        .then(maxIds =>
          Promise.all(
            config.instances.map(instance =>
              login({ url: instance.url })
                .then(client =>
                  client.v1.timelines.listPublic({
                    local: true,
                    limit: config.maxFetchCount,
                    sinceId: maxIds.find(mi => mi.instance == instance.name)?.id?.toString(),
                  })
                )
                .then(selected => {
                  if (process.env.TOOTBACK_IS_LOCAL) {
                    selected.forEach(s => logger.debug(statusToString(s, instance.name)));
                  }
                  return selected.map(s => statusToToot(s, instance.name));
                })
            )
          )
        )
        .then(toots => model.registerStatus(toots.flat(), datasetId));
    })
    .then(() => logger.info('tootback_batch finish.'))
    .catch(e => logger.error(e));

export { appMain };
