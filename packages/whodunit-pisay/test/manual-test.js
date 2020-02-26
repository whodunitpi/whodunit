'use strict';
const chalk = require('chalk');
const pisay = require('../');

/*
 * Yo. Fire this file locally with `node test/manual-test.js` at least after you
 * have newly generated the text fixtures to double check that all available
 * option have a correct looking output.
 * Thanks (ᵔᴥᵔ)
 */

console.log(pisay('Hello, and welcome to my fantastic investigator full of whimsy and bubble gum!'));

console.log(pisay('Hi'));

console.log(pisay('Welcome to whodunit, ladies and gentlemen!'));

console.log(pisay('Hi', {maxLength: 8}));

console.log(pisay('Hello, buddy!', {maxLength: 4}));

console.log(pisay(chalk.red.bgWhite('Hi')));

console.log(pisay(chalk.red.bgWhite('Hi') + ' there, sir!'));

console.log(pisay(chalk.red.bgWhite('Hi') + ' there, sir! ' + chalk.bgBlue.white('you are looking') + ' swell today!'));

console.log(pisay('first line\nsecond line\n\nfourth line'));

console.log(pisay('项目可以更新了'));

console.log(pisay('iloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicorns'));

console.log(pisay('Lie on your belly and purr when you are asleep shove bum in owner’s face like camera lens. Cough furball.', {maxLength: 11}));
console.log(pisay('Lie on your belly and purr when you are asleep shove bum in owner’s face like camera lens. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball.'));
console.log(pisay('Lie on your belly and purr when you are asleep shove bum in owner’s face like camera lens. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball.', {maxLength: 11}));
console.log(pisay('Lie on your belly and purr when you are asleep shove bum in owner’s face like camera lens. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball. Cough furball.', {maxLength: 26}));

console.log(pisay(
  'That’s it. Feel free to fire up the server with ' +
  chalk.green('`npm run start:dev`') +
  'or use our subinvestigator to create endpoints.'
));

console.log(pisay('That’s it. Feel free to fire up the server with `npm run start:dev` or use our subinvestigator to create endpoints.'));

console.log(pisay(
  'That’s it. Feel free to fire up the server with ' +
  chalk.green('`npm run start:dev`') + '.'
));

console.log(pisay(
  'That’s it. Feel free to fire up the server with ' +
  '`npm run start:dev`.'
));

console.log(pisay(
  `Welcome to the polished ${chalk.red('something iloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicorns')} investigator!`
));

console.log(pisay(
  `Welcome to the polished ${chalk.red('something iloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicorns')} investigator! Another long sentence ${chalk.yellow('something iloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicornsiloveunicorns')}normal text`
));
