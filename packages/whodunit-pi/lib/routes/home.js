'use strict';
const _ = require('lodash');
const chalk = require('chalk');
const fullname = require('fullname');
const inquirer = require('inquirer');
const {isString} = require('lodash');
const {namespaceToName} = require('@whodunit/environment');
const globalConfigHasContent = require('../utils/global-config').hasContent;

module.exports = app => {
  const defaultChoices = [{
    name: 'Install an investigator',
    value: 'install'
  }, {
    name: 'Find some help',
    value: 'help'
  }, {
    name: 'Get me out of here!',
    value: 'exit'
  }];

  if (globalConfigHasContent()) {
    defaultChoices.splice(defaultChoices.length - 1, 0, {
      name: 'Clear global config',
      value: 'clearConfig'
    });
  }

  const investigatorList = _.chain(app.investigators).map(investigator => {
    if (!investigator.appInvestigator) {
      return null;
    }

    const updateInfo = investigator.updateAvailable ? chalk.dim.yellow(' ♥ Update Available!') : '';

    return {
      name: investigator.prettyName + updateInfo,
      value: {
        method: 'run',
        investigator: investigator.namespace
      }
    };
  }).compact().sortBy(el => {
    const investigatorName = namespaceToName(el.value.investigator);
    return -app.conf.get('investigatorRunCount')[investigatorName] || 0;
  }).value();

  if (investigatorList.length > 0) {
    defaultChoices.unshift({
      name: 'Update your investigators',
      value: 'update'
    });
  }

  app.insight.track('pipi', 'home');

  return fullname().then(name => {
    const allo = (name && isString(name)) ? `'Aloha ${name.split(' ')[0]}! ` : '\'Aloha! ';

    return inquirer.prompt([{
      name: 'whatNext',
      type: 'list',
      message: `${allo}What would you like to do?`,
      choices: _.flatten([
        new inquirer.Separator('Run an investigation'),
        investigatorList,
        new inquirer.Separator(),
        defaultChoices,
        new inquirer.Separator()
      ])
    }]).then(answer => {
      if (answer.whatNext.method === 'run') {
        app.navigate('run', answer.whatNext.investigator);
        return;
      }

      if (answer.whatNext === 'exit') {
        return;
      }

      app.navigate(answer.whatNext);
    });
  });
};
