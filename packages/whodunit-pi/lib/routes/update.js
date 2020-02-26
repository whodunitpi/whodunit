'use strict';
const chalk = require('chalk');
const inquirer = require('inquirer');
const spawn = require('cross-spawn');

const successMsg = 'I\'ve just updated your investigators. Remember, you can update\na specific investigator with npm by running:\n' +
  chalk.magenta('\n    npm install -g investigator-_______');

function updateSuccess(app) {
  app.insight.track('pipi', 'updated');
  console.log(`\n${chalk.cyan(successMsg)}\n`);
  app.env.lookup(() => {
    app.updateAvailableInvestigators();
    app.navigate('home');
  });
}

function updateInvestigators(app, pkgs) {
  spawn('npm', ['install', '--global'].concat(pkgs), {stdio: 'inherit'})
    .on('close', updateSuccess.bind(null, app));
}

module.exports = app => {
  app.insight.track('pipi', 'update');

  return inquirer.prompt([{
    name: 'investigators',
    message: 'Investigators to update',
    type: 'checkbox',
    validate(input) {
      return input.length > 0 ? true : 'Please select at least one investigator to update.';
    },
    choices: Object.keys(app.investigators || {}).map(key => {
      return {
        name: app.investigators[key].name,
        checked: true
      };
    })
  }]).then(answer => {
    updateInvestigators(app, answer.investigators);
  });
};
