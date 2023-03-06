import { mastodon } from 'masto';

export interface InstanceConfig {
  url: string;
  name: string;
}
interface BigqueryConfig {
  datasetId: string;
}
/** 設定情報 */
export interface Config {
  /** 一度に取得するトゥート件数。API仕様により定められている */
  maxFetchCount: number;
  /** 対象インスタンスのURL */
  instances: InstanceConfig[];
  bigquery: BigqueryConfig;
}
