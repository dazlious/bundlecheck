/* eslint-disable no-console */
const arg = require('arg');
const chalk = require('chalk');
const path = require('path');
const { Bundlecheck } = require('./bundlecheck');

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

module.exports = {
  cli: args => {
    const { configfile } = parseArgs(args);
    let config = {};
    try {
      // eslint-disable-next-line global-require,import/no-dynamic-require
      config = require(path.resolve(configfile));
    } catch (_err) {
      console.warn(`Failed reading config file ${configfile}. Using default config.`);
    }

    const bc = new Bundlecheck(config);
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
