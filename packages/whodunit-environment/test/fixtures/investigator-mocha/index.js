var Investigator = require('@whodunit/investigator');

class NewInvestigator extends Investigator {
  default() {
    console.log('Executing investigator with', this.arguments, this.options);
  }
};

NewInvestigator.name = 'You can name your investigator';
NewInvestigator.description = 'Ana add a custom description by adding a `description` property to your function.';
NewInvestigator.usage = 'Usage can be used to customize the help output';

// namespace is resolved depending on the location of this investigator,
// unless you specifically define it.
NewInvestigator.namespace = 'mocha:investigator';

module.exports = NewInvestigator;
