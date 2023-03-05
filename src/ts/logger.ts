import moment from 'moment';
import * as fs from 'fs/promises';
import { Logging } from '@google-cloud/logging';
import { LogEntry } from '@google-cloud/logging/build/src/entry';

// Creates a client
const glog = new Logging({ projectId: 'tootback' }).log('tootback_batch');

export function log(level: string, msg: string | object) {
  const lvl = level.substring(0, 1).toUpperCase();
  if (process.env.TOOTBACK_IS_LOCAL) {
    if (typeof msg == 'string') {
      msg.split(/[\r\n]+/g).forEach(l => fs.appendFile('./batch.log', `${moment().format()} [${lvl}] ${l}\n`));
    } else {
      msg
        .toString()
        .split(/[\r\n]+/g)
        .forEach(l => fs.appendFile('./batch.log', `${moment().format()} [${lvl}] ${l}\n`));
    }
  } else {
    const sever = (l1: string) => {
      switch (l1) {
        case 'I':
          return 'INFO';
        case 'W':
          return 'WARNING';
        case 'E':
          return 'ERROR';
        default:
          return 'INFO';
      }
    };
    // The metadata associated with the entry
    const metadata = <LogEntry>{
      resource: { type: 'global' },
      // See: https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#logseverity
      severity: sever(lvl),
      labels: { label: 'batchLog' },
    };
    glog.write(glog.entry(metadata, msg));
  }
}
