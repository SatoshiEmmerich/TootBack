import moment from 'moment';
import * as fs from 'fs/promises';
import { Logging } from '@google-cloud/logging';
import { LogEntry } from '@google-cloud/logging/build/src/entry';
import crypto from 'crypto';

const rand = crypto.randomBytes(20).toString('hex').substring(0, 6);
// Creates a client
const glog = new Logging({ projectId: 'tootback' }).log('tootback_batch');

export function log(level: string, msg: string | object) {
  const lvl = level.substring(0, 1).toUpperCase();
  if (process.env.TOOTBACK_IS_LOCAL) {
    if (typeof msg == 'string') {
      return Promise.all(
        msg.split(/[\r\n]+/g).map(l => fs.appendFile('./batch.log', `${moment().format()} [${lvl}] ${l}\n`))
      );
    } else {
      return Promise.all(
        JSON.stringify(msg, null, '  ')
          .split(/[\r\n]+/g)
          .map(l => fs.appendFile('./batch.log', `${moment().format()} [${lvl}] ${l}\n`))
      );
    }
  } else {
    const sever = (lchar: string) => {
      switch (lchar) {
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
      labels: { runName: 'tootback-batch', runId: `tb:${rand}` },
    };
    return glog.write(glog.entry(metadata, msg));
  }
}
