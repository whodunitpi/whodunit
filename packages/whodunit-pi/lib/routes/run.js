'use strict';
const chalk = require('chalk');
const {namespaceToName} = require('@whodunit/environment');

module.exports = (app, name) => {
  const baseName = namespaceToName(name);
  app.insight.track('pipi', 'run', baseName);

  console.log(
    chalk.dim('\nThis investigator can also be run with: ') +
    chalk.blue(`pi ${baseName}\n`)
  );

  // Save the investigator run count
  const investigatorRunCount = app.conf.get('investigatorRunCount');
  investigatorRunCount[baseName] = investigatorRunCount[baseName] + 1 || 1;
  app.conf.set('investigatorRunCount', investigatorRunCount);
  app.env.run(name);
};
