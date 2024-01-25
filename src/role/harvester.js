const {random} = require("lodash");
global.STATE_HARVESTING_ENERGY = 'harvesting_energy';
global.STATE_DELIVERING_ENERGY = 'delivering_energy';

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.stateHarvestEnergy()
    }

};

module.exports = roleHarvester;

/**
 * Main function for harvester FSM
 */
Creep.prototype.runHarvester = function () {
    switch (this.memory.state) {
        case global.STATE_HARVESTING_ENERGY:
            this.stateHarvestEnergy();
            break;
        case global.STATE_DELIVERING_ENERGY:
            this.stateDeliverEnergy();
            break;
        default:
            this.memory.state = global.STATE_HARVESTING_ENERGY;
    }
}

/**
 *
 */
Creep.prototype.stateHarvestEnergy = function () {
    const sources = this.room.find(FIND_SOURCES);
    let targetSource = null;
    if (this.memory.targetSourceId) {
        for (const source of sources) {
            if (source.id === this.memory.targetSourceId) {
                targetSource = source;
                break;
            }
        }
    }
    else {
        targetSource = sources[random(0, sources.length)];
        this.memory.targetSourceId = targetSource.id;
    }

    // Harvest Process
    if (this.harvest(targetSource) === ERR_NOT_IN_RANGE) {
        this.moveTo(targetSource, {
            visualizePathStyle: {stroke: '#ffaa00'}
        });
    }

    // Transition to Deliver
    if (this.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        // delete this.memory.targetSourceId;
        this.memory.targetSourceId = null;
        this.memory.state = global.STATE_DELIVERING_ENERGY;
        this.say("🛒")
    }
}

Creep.prototype.stateDeliverEnergy = function () {
    // Deliver Process
    const deliverySpots = this.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_SPAWN) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    if (deliverySpots.length > 0) {
        if (this.transfer(deliverySpots[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.moveTo(deliverySpots[0], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }

    // Transition to Harvest
    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("🛒")
    }
}