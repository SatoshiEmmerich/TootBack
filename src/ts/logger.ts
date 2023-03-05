import moment from 'moment';
import * as fs from 'fs/promises';

export function log(level: string, msg: string | object) {
  if (process.env.TOOTBACK_IS_LOCAL) {
    const lvl = level.substring(0, 1).toUpperCase();
    if (typeof msg == 'string') {
      msg.split(/[\r\n]+/g).forEach(l => fs.appendFile('./batch.log', `${moment().format()} [${lvl}] ${l}\n`));
    } else {
      msg
        .toString()
        .split(/[\r\n]+/g)
        .forEach(l => fs.appendFile('./batch.log', `${moment().format()} [${lvl}] ${l}\n`));
    }
  }
}
