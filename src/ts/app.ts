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

const sleep = (ms: number) => new Promise((resolve, _reject) => setTimeout(resolve, ms));

const fetchToots = async (client: mastodon.Client, instanceName: string, config: Config, firstSinceId?: string) => {
  const toots: model.Toot[] = [];
  let sinceId = Number.parseInt(firstSinceId ?? '0');
  let found = 11;
  // 取得のたびに新規トゥートがあると無限ループになるので、少なかったら打ち切り
  // 今後APIの一括取得数が増減するかもしれないので、その値ではなく小さく10にしておく
  while (found > 10) {
    logger.debug('start fetching.', { instanceName, sinceId: sinceId });
    const list = await sleep(500)
      .then(() =>
        client.v1.timelines.listPublic({
          local: true,
          limit: config.maxFetchCount,
          sinceId: sinceId.toString(),
        })
      )
      .then(selected => {
        if (process.env.TOOTBACK_IS_LOCAL) {
          selected.forEach(s => logger.debug(statusToString(s, instanceName)));
        }
        return selected.map(s => statusToToot(s, instanceName));
      });
    found = list.length;
    logger.info('fetched.', { instanceName, found });
    if (sinceId == list[0].id) {
      break;
    }
    sinceId = list[0].id;
    list.forEach(item => toots.push(item));
  }
  return toots;
};

const appMain = (confFile: string) =>
  fs
    .readFile(confFile)
    .then(configBuffer => {
      const config = JSON.parse(configBuffer.toString()) as Config;
      return model
        .getMaxLoadedIds(config.runIntervalMinutes)
        .then(maxIds =>
          Promise.all(
            config.instances.map(instance =>
              login({ url: instance.url }).then(client => {
                const sinceId = maxIds.find(mi => mi.instance == instance.name)?.id?.toString();
                return fetchToots(client, instance.name, config, sinceId);
              })
            )
          )
        )
        .then(toots => model.registerStatus(toots.flat()));
    })
    .then(() => logger.info('tootback_batch finish.'))
    .catch(e => logger.error(e));

export { appMain };
