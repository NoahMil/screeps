global.STATE_HARVESTING_ENERGY = 'harvesting_energy';
global.STATE_DELIVERING_ENERGY = 'delivering_energy';
global.STATE_LOOTING_ENERGY = 'looting_energy';
global.STATE_BUILDING_ENERGY = 'building_energy';
global.STATE_UPGRADING_ENERGY = 'upgrading_energy'

const {random} = require("lodash");
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
        if (this.memory.role === 'harvester') {
            this.memory.state = global.STATE_DELIVERING_ENERGY;
            this.say("🛒");
        }
        if (this.memory.role === 'builder') {
            this.memory.state = global.STATE_BUILDING_ENERGY;
            this.say("🧱");
        }

        if (this.memory.role === 'upgrader') {
            this.memory.state = global.STATE_UPGRADING_ENERGY;
            this.say("📈");
        }
}


    Creep.prototype.stateDeliverEnergy = function () {
        // First, try to find extensions with free capacity
        let deliverySpots = this.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_EXTENSION &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        // If no extensions are found, then look for spawns
        if (deliverySpots.length === 0) {
            deliverySpots = this.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType === STRUCTURE_SPAWN &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
                }
            });
        }

        // Proceed to transfer energy to the nearest delivery spot
        if (deliverySpots.length > 0) {
            const closestDeliverySpot = this.pos.findClosestByPath(deliverySpots);
            if (closestDeliverySpot && this.transfer(closestDeliverySpot, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.moveTo(closestDeliverySpot, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }

        // Check if the creep's energy is depleted and change state accordingly
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
            this.memory.state = global.STATE_HARVESTING_ENERGY;
            this.say("⛏️");
        } else {
            const droppedResources = this.room.find(FIND_DROPPED_RESOURCES, {
                filter: (resource) => {
                    return resource.resourceType === RESOURCE_ENERGY;
                }
            });
            if (droppedResources.length > 0) {
                this.memory.state = global.STATE_LOOTING_ENERGY;
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
}}

Creep.prototype.stateBuildEnergy = function () {
    var targets = this.room.find(FIND_CONSTRUCTION_SITES);
    if(targets.length) {
        if(this.build(targets[0]) === ERR_NOT_IN_RANGE) {
            this.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
}

Creep.prototype.stateUpgradeEnergy = function () {
    if(this.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
        this.moveTo(this.room.controller);
    }

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
}
