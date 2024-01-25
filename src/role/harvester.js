global.STATE_HARVESTING_ENERGY = 'harvesting_energy';
global.STATE_DELIVERING_ENERGY = 'delivering_energy';

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function (creep) {
        creep.stateHarvestEnergy()
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
    }
}

Creep.prototype.stateHarvestEnergy = function () {
    if (this.store.getFreeCapacity() > 0) {
        this.findClosestSourceAndHarvest();
        this.say("⛏️")
    }

    if (this.store.getFreeCapacity() === 0) {
        this.memory.state = global.STATE_DELIVERING_ENERGY;
        this.say("🛒")
    }
}

Creep.prototype.stateDeliverEnergy = function () {
    this.deliverResources();
}


Creep.prototype.deliverResources = function () {
    const deliverySpots = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });
    if (deliverySpots.length > 0) {
        if (this.transfer(deliverySpots[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.moveTo(deliverySpots[0], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
}

Creep.prototype.findClosestSourceAndHarvest = function () {
    const targetSource = this.pos.findClosestByPath(FIND_SOURCES)
    if (this.harvest(targetSource) === ERR_NOT_IN_RANGE) {
        this.moveTo(targetSource, {
            visualizePathStyle: {stroke: '#ffaa00'}
        });
    }
}