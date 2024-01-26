const { random } = require("lodash");
require('extensions.creepExtension');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        creep.runHarvester();
    }

};

module.exports = roleHarvester;

Creep.prototype.runHarvester = function () {
    switch (this.memory.state) {
        case global.STATE_HARVESTING_ENERGY:
            this.stateHarvestEnergy();
            break;
        case global.STATE_DELIVERING_ENERGY:
            this.stateDeliverEnergy();
            break;
        case global.STATE_LOOTING_ENERGY:
            this.stateLootEnergy();
            break;
        default:
            this.memory.state = global.STATE_HARVESTING_ENERGY;
    }
}
