import { mastodon } from 'masto';

export interface InstanceConfig {
  url: string;
  name: string;
}

/** 設定情報 */
export interface Config {
  /** 一度に取得するトゥート件数。mastodon の API仕様により定められている */
  maxFetchCount: number;
  /** このコンテナが実行される頻度 */
  runIntervalMinutes: number;
  /** 対象インスタンスのURL */
  instances: InstanceConfig[];
}
