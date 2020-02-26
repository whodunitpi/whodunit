'use strict';
const inquirer = require('inquirer');
const opn = require('opn');

module.exports = app => {
  app.insight.track('pipi', 'help');

  return inquirer.prompt([{
    name: 'whereTo',
    type: 'list',
    message: 'Here are a few helpful resources.\n\nI will open the link you select in your browser for you',
    choices: [{
      name: 'Take me to the documentation',
      value: 'http://whodunit.io/learning/'
    }, {
      name: 'View Frequently Asked Questions',
      value: 'http://whodunit.io/learning/faq.html'
    }, {
      name: 'File an issue on GitHub',
      value: 'http://whodunit.io/contributing/opening-issues.html'
    }, {
      name: 'Take me back home.',
      value: 'home'
    }]
  }]).then(answer => {
    app.insight.track('pipi', 'help', answer);

    if (answer.whereTo === 'home') {
      console.log('I get it, you like learning on your own. I respect that.');
      app.navigate('home');
      return;
    }

    opn(answer.whereTo);
  });
};
