const { random } = require("lodash");
require('extensions.creepExtension');

var roleFighter = {

    /** @param {Creep} creep **/
    run: function(creep) {
        creep.runFighter();
    }

};

module.exports = roleFighter;

Creep.prototype.runFighter = function () {
    switch (this.memory.state) {
        case global.STATE_FIGHTING:
            this.stateFighting();
            break;
        default:
            this.memory.state = global.STATE_FIGHTING;
    }
}