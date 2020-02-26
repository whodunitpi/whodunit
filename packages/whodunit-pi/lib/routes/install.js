'use strict';
/* eslint-disable promise/no-callback-in-promise */
const _ = require('lodash');
const async = require('async');
const chalk = require('chalk');
const inquirer = require('inquirer');
const spawn = require('cross-spawn');
const sortOn = require('sort-on');
const figures = require('figures');
const npmKeyword = require('npm-keyword');
const packageJson = require('package-json');
const got = require('got');

const OFFICIAL_INVESTIGATORS = [
  // TODO
];

module.exports = app => {
  app.insight.track('pipi', 'install');

  return inquirer.prompt([{
    name: 'searchTerm',
    message: 'Search npm for investigators:'
  }]).then(answers => searchNpm(app, answers.searchTerm));
};

const investigatorMatchTerm = (investigator, term) => `${investigator.name} ${investigator.description}`.includes(term);
const getAllInvestigators = _.memoize(() => npmKeyword('@whodunit/investigator'));

function searchMatchingInvestigators(app, term, cb) {
  function handleBlacklist(blacklist) {
    const installedInvestigators = app.env.getInvestigatorNames();

    getAllInvestigators().then(allInvestigators => {
      cb(null, allInvestigators.filter(investigator => {
        if (blacklist.includes(investigator.name)) {
          return false;
        }

        if (installedInvestigators.includes(investigator.name)) {
          return false;
        }

        return investigatorMatchTerm(investigator, term);
      }));
    }, cb);
  }
  got('http://whodunit.io/blacklist.json', {json: true})
    .then(response => handleBlacklist(response.body))
    .catch(() => handleBlacklist([]));
}

function fetchInvestigatorInfo(investigator, cb) {
  packageJson(investigator.name, {fullMetadata: true}).then(pkg => {
    const official = OFFICIAL_INVESTIGATORS.includes(pkg.name);
    const mustache = official ? chalk.green(` ${figures.mustache} `) : '';

    cb(null, {
      name: investigator.name.replace(/^investigator-/, '') + mustache + ' ' + chalk.dim(pkg.description),
      value: investigator.name,
      official: -official
    });
  }).catch(cb);
}

function searchNpm(app, term) {
  const promise = new Promise((resolve, reject) => {
    searchMatchingInvestigators(app, term, (err, matches) => {
      if (err) {
        reject(err);
        return;
      }

      async.map(matches, fetchInvestigatorInfo, (err2, choices) => {
        if (err2) {
          reject(err2);
          return;
        }

        resolve(choices);
      });
    });
  });

  return promise.then(choices => promptInstallOptions(app, sortOn(choices, ['official', 'name'])));
}

function promptInstallOptions(app, choices) {
  let introMessage = 'Sorry, no results matches your search term';

  if (choices.length > 0) {
    introMessage = 'Here\'s what I found. ' + chalk.gray('Official investigator → ' + chalk.green(figures.mustache)) + '\n  Install one?';
  }

  const resultsPrompt = [{
    name: 'toInstall',
    type: 'list',
    message: introMessage,
    choices: choices.concat([{
      name: 'Search again',
      value: 'install'
    }, {
      name: 'Return home',
      value: 'home'
    }])
  }];

  return inquirer.prompt(resultsPrompt).then(answer => {
    if (answer.toInstall === 'home' || answer.toInstall === 'install') {
      return app.navigate(answer.toInstall);
    }

    installInvestigator(app, answer.toInstall);
  });
}

function installInvestigator(app, pkgName) {
  app.insight.track('pipi', 'install', pkgName);

  return spawn('npm', ['install', '--global', pkgName], {stdio: 'inherit'})
    .on('error', err => {
      app.insight.track('pipi:err', 'install', pkgName);
      throw err;
    })
    .on('close', () => {
      app.insight.track('pipi', 'installed', pkgName);

      console.log(
        '\nI just installed an investigator by running:\n' +
        chalk.blue.bold('\n    npm install -g ' + pkgName + '\n')
      );

      app.env.lookup(() => {
        app.updateAvailableInvestigators();
        app.navigate('home');
      });
    });
}
