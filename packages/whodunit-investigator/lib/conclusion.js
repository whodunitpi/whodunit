'use strict';

/**
 * The `Conclusion` class provides the common API shared by all conclusions.
 * It defines the yes/no test that will be run. It is used by the conclusion
 * to build a decision tree that results in a `Conclusion` 
 * *
 * Every conclusion should extend this base class.
 *
 * @constructor
 *
 * @param {Object} details
 *
 * @example
 * const { Conclusion } = require('@whodunit/investigator');
 * module.exports = class extends Conclusion {
 * };
 */
class Conclusion {
    constructor(info, props) {
        const { text, details, recommendations, status } = info;
        this._text = text;
        this._details = details;
        this._recommendations = recommendations;
        this._status = status;
        this._props = props;
    }

    _resolveProps(value) {
        const props = this._props;
        return eval(`\`${value}\``);
    }

    getText() { return this._resolveProps(this._text); }
    getDetails() { return this._resolveProps(this._details); }
    getRecommendations() { return this._recommendations.map(r => this._resolveProps(r)); }
    getStatus() { return this._status; }
    getMarkdown() {
        return [
            "",
            `## Status: ${this._status}`,
            `${this.getText()}`,
            `## Details`,
            `${this.getDetails()}`,
            `## Recommendations`,
            ...this.getRecommendations().map(r => `* ${r}`)
        ].join("\n");
    }
}

module.exports = Conclusion;
