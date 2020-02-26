'use strict';
const pisay = require('@whodunit/pisay');

module.exports = app => {
  app.insight.track('pipi', 'exit');

  const PADDING = 5;
  const url = 'http://whodunit.io';
  const maxLength = url.length + PADDING;
  const newLine = ' '.repeat(maxLength);

  console.log(pisay(
    'Bye from us!' +
    newLine +
    'Chat soon.' +
    newLine +
    'whodunit team ',
    {maxLength}
  ));
};
