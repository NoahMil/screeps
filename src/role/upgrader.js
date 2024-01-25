const { random } = require("lodash");
require('extensions.creepExtension');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {
        creep.runUpgrader();
    }

};

module.exports = roleUpgrader;

Creep.prototype.runUpgrader = function () {
    switch (this.memory.state) {
        case global.STATE_HARVESTING_ENERGY:
            this.stateHarvestEnergy();
            break;
        case global.STATE_UPGRADING_ENERGY:
            this.stateUpgradeEnergy();
            break;
        default:
            this.memory.state = global.STATE_HARVESTING_ENERGY;
    }
}