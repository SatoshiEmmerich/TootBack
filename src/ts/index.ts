console.log('tootback_batch start.');
import { login, mastodon } from 'masto';
import { stripHtml } from 'string-strip-html';
import moment from 'moment';
import * as fs from 'fs/promises';

interface ConfigInstance {
  url: string;
  name: string;
}
/** 設定情報 */
interface Config {
  /** 取得インターバルを計算できなかった場合のデフォルト値 */
  defaultFetchInterval: number;
  /** 最低の取得インターバル。これ以下の間隔での取得は行われない。 */
  minFetchInterval: number;
  /** 一度に取得するトゥート件数。API仕様により定められている */
  maxFetchCount: number;
  /** 対象インスタンスのURL */
  instances: ConfigInstance[];
}

/** ループ処理で引き継ぐ設定情報 */
interface LoopContext {
  config: Config;
  client: mastodon.Client;
  instance: ConfigInstance;
  intervalMs: number;
  params: mastodon.v1.ListTimelineParams;
}
type Status = mastodon.v1.Status;

const calcInterval = (selected: Status[], config: Config) => {
  if (!selected || selected.length == 0) {
    return { newIntervalMs: config.defaultFetchInterval, tootPerMs: 0 };
  }
  const toots = selected.length;
  const elapsedMs = moment(selected[selected.length - 1].createdAt).valueOf() - moment(selected[0].createdAt).valueOf();
  const tootPerMs = toots / elapsedMs;
  const newIntervalMs = Math.max(Math.round(config.maxFetchCount / tootPerMs), config.minFetchInterval);
  return { newIntervalMs, tootPerMs };
};

const statusToString = (s: Status, ctx: LoopContext) =>
  [
    `[${(ctx.instance.name + ' '.repeat(8)).substring(0, 8)}]`,
    moment(s.createdAt).format('hh:mm:ss'),
    // s.id,
    s.account.displayName,
    stripHtml(s.content).result.substring(0, 15),
  ].join(' ');

function monitoringLoop(ctx: LoopContext) {
  return ctx.client.v1.timelines
    .listPublic(ctx.params)
    .then(statuses => {
      const selected = statuses.sort((a, b) => a.id.localeCompare(b.id));
      selected.forEach(s => console.log(statusToString(s, ctx)));

      const { newIntervalMs, tootPerMs } = calcInterval(selected, ctx.config);
      console.info(
        `[${(ctx.instance.name + ' '.repeat(8)).substring(0, 8)}] ${moment().format('hh:mm:ss')} ${
          selected.length
        } toots, ${newIntervalMs} [ms] sleep. ${Math.round(tootPerMs * 1000 * 60)} [toots/min]`
      );

      const newLoopState: LoopContext = Object.assign({}, ctx);
      newLoopState.params = Object.assign(ctx.params, {
        sinceId: selected.length > 0 ? selected[selected.length - 1].id : ctx.params.sinceId,
      });

      return newLoopState;
    })
    .then(ctx => new Promise<LoopContext>((resolve, _reject) => setTimeout(() => resolve(ctx), ctx.intervalMs)));
}

function monitorInstance(ctx: LoopContext): Promise<(ctx: LoopContext) => Promise<void>> {
  return monitoringLoop(ctx)
    .then(nctx => monitorInstance(nctx))
    .catch(e => monitorInstance(ctx));
}

async function main(instance: ConfigInstance, config: Config) {
  login({ url: instance.url }).then(client =>
    monitorInstance({
      config: config,
      client: client,
      instance: instance,
      intervalMs: config.defaultFetchInterval,
      params: {
        local: true,
        limit: config.maxFetchCount,
      },
    })
  );
}

fs.readFile('./config.json')
  .then(value => {
    const config = JSON.parse(value.toString()) as Config;
    config.instances.forEach(instance => main(instance, config));
  })
  .catch(e => console.error(e));
