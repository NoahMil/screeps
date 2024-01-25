const { random } = require("lodash");
require('extensions.creepExtension');

var roleBuilder = {

    /** @param {Creep} creep **/
    run: function(creep) {
        creep.runBuilder();
    }

};

module.exports = roleBuilder;

Creep.prototype.runBuilder = function () {
    switch (this.memory.state) {
        case global.STATE_HARVESTING_ENERGY:
            this.stateHarvestEnergy();
            break;
        case global.STATE_BUILDING_ENERGY:
            this.stateBuildEnergy();
            break;
        default:
            this.memory.state = global.STATE_HARVESTING_ENERGY;
    }
}

