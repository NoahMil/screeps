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
        case global.STATE_REPAIRING_ENERGY:
            this.stateRepairEnergy();
            break;
        case global.STATE_DELIVERING_ENERGY:
            this.stateDeliverEnergy();
            break;
        default:
            this.memory.state = global.STATE_HARVESTING_ENERGY;
            console.log(this.name + ' (Builder) - Switching to default state: Harvesting Energy');

    }
}

