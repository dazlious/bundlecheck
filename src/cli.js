/* eslint-disable no-console */
import arg from 'arg';
import chalk from 'chalk';
import path from 'path';

import { Bundlecheck } from './bundlecheck.js';

function parseArgs([,, ...argv]) {
  const args = arg(
    {
      '--configfile': String,
      '-cf': '--configfile',
    },
    {
      argv,
    },
  );
  return {
    configfile: args['--configfile'] || '.bundlecheck.config.js',
  };
}

export default {
  cli: async args => {
    const { configfile } = parseArgs(args);
    let config = {};
    try {
      config = await import(path.resolve(configfile));
    } catch (_err) {
      console.warn(`Failed reading config file ${configfile}. Using default config.`);
    }

    const bc = new Bundlecheck(config?.default);
    const { result, message } = bc.check();

    if (result) {
      console.log('%s Bundlecheck passed', chalk.green.bold('OK'));
      process.exit(0);
    } else {
      message.forEach(msg => {
        console.error(`%s ${msg}`, chalk.red.bold('ERROR'));
      });
      process.exit(1);
    }
  },
};
