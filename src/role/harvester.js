const {random} = require("lodash");
global.STATE_HARVESTING_ENERGY = 'harvesting_energy';
global.STATE_DELIVERING_ENERGY = 'delivering_energy';
global.STATE_LOOTING_ENERGY = 'looting_energy';

var roleHarvester = {
    /** @param {Creep} creep **/
    run: function (creep) {
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
            break;
    }
}

Creep.prototype.stateHarvestEnergy = function () {
    const sources = this.room.find(FIND_SOURCES);
    let targetSource = null;
    if (this.memory.targetSourceId) {
        targetSource = Game.getObjectById(this.memory.targetSourceId);
    }
    if (!targetSource) {
        targetSource = sources[random(0, sources.length - 1)];
        this.memory.targetSourceId = targetSource.id;
    }

    if (this.harvest(targetSource) === ERR_NOT_IN_RANGE) {
        this.moveTo(targetSource, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

    if (this.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.targetSourceId = null;
        this.memory.state = global.STATE_DELIVERING_ENERGY;
        this.say("🛒");
    }
}

Creep.prototype.stateDeliverEnergy = function () {
    const deliverySpots = this.room.find(FIND_STRUCTURES, {
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

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
    else {
        const droppedResources = this.room.find(FIND_DROPPED_RESOURCES, {
            filter: (resource) => {
                return resource.resourceType === RESOURCE_ENERGY;
            }
        });
        if (droppedResources.length > 0) {
            this.memory.state = global.STATE_LOOTING_ENERGY;
            this.say("🤑");
        }
    }
}

Creep.prototype.stateLootEnergy = function () {
    const droppedResources = this.room.find(FIND_DROPPED_RESOURCES, {
        filter: (resource) => {
            return resource.resourceType === RESOURCE_ENERGY;
        }
    });

    if (droppedResources.length > 0) {
        const closestDroppedResource = this.pos.findClosestByPath(droppedResources);
        if (closestDroppedResource && this.pickup(closestDroppedResource) === ERR_NOT_IN_RANGE) {
            this.moveTo(closestDroppedResource, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }

    // Transition to Delivering if storage is full
    if (this.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_DELIVERING_ENERGY;
        this.say("🛒");
    }
    // Transition to Harvesting if no dropped resources and storage is not full
    else if (droppedResources.length === 0 && this.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
}
