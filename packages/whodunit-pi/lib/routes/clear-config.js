'use strict';
const _ = require('lodash');
const chalk = require('chalk');
const inquirer = require('inquirer');
const {namespaceToName} = require('@whodunit/environment');
const globalConfig = require('../utils/global-config');

module.exports = app => {
  app.insight.track('pipi', 'clearGlobalConfig');

  const defaultChoices = [
    {
      name: 'Take me back home.',
      value: 'home'
    }
  ];

  const investigatorList = _.chain(globalConfig.getAll()).map((val, key) => {
    let prettyName = '';
    let sort = 0;

    // Remove version from investigator name
    const name = key.split(':')[0];
    const investigator = app.investigators[name];

    if (investigator) {
      ({prettyName} = investigator);
      sort = -app.conf.get('investigatorRunCount')[namespaceToName(investigator.namespace)] || 0;
    } else {
      prettyName = name.replace(/^investigator-/, '') + chalk.red(' (not installed anymore)');
      sort = 0;
    }

    return {
      name: prettyName,
      sort,
      value: key
    };
  }).compact().sortBy(investigatorName => investigatorName.sort).value();

  if (investigatorList.length > 0) {
    investigatorList.push(new inquirer.Separator());
    defaultChoices.unshift({
      name: 'Clear all',
      value: '*'
    });
  }

  return inquirer.prompt([{
    name: 'whatNext',
    type: 'list',
    message: 'Which store would you like to clear?',
    choices: _.flatten([
      investigatorList,
      defaultChoices
    ])
  }]).then(answer => {
    app.insight.track('pipi', 'clearGlobalConfig', answer);

    if (answer.whatNext === 'home') {
      app.navigate('home');
      return;
    }

    _clearInvestigatorConfig(app, answer.whatNext);
  });
};

/**
 * Clear the given investigator from the global config file
 * @param  {Object} app
 * @param  {String} investigator Name of the investigator to be clear. Use '*' to clear all investigators.
 */
function _clearInvestigatorConfig(app, investigator) {
  if (investigator === '*') {
    globalConfig.removeAll();
  } else {
    globalConfig.remove(investigator);
  }

  console.log('Global config has been successfully cleared');
  app.navigate('home');
}
