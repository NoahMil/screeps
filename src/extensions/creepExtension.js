global.STATE_HARVESTING_ENERGY = 'harvesting_energy';
global.STATE_DELIVERING_ENERGY = 'delivering_energy';
global.STATE_LOOTING_ENERGY = 'looting_energy';
global.STATE_BUILDING_ENERGY = 'building_energy';
global.STATE_UPGRADING_ENERGY = 'upgrading_energy'
global.STATE_REPAIRING_ENERGY = 'repairing_energy'


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
        switch (this.memory.role) {
            case 'harvester':
                this.memory.state = global.STATE_DELIVERING_ENERGY;
                this.say("🛒");
                break;
            case 'builder':
                // Check if there are construction sites before transitioning to building
                const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
                if (constructionSites.length) {
                    this.memory.state = global.STATE_BUILDING_ENERGY;
                    this.say("🧱");
                } else {
                    // No construction sites, transition to repairing
                    this.memory.state = global.STATE_REPAIRING_ENERGY;
                    this.say("🔧");
                }
                break;
            case 'upgrader':
                this.memory.state = global.STATE_UPGRADING_ENERGY;
                this.say("📈");
                break;
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
    var constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length) {
        if (this.build(constructionSites[0]) === ERR_NOT_IN_RANGE) {
            this.moveTo(constructionSites[0], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    } else {
        // No construction sites, transition to repairing for builders
        if (this.memory.role === 'builder') {
            this.memory.state = global.STATE_REPAIRING_ENERGY;
            this.say("🔧");
        }
    }

    // Transition to harvesting if energy is depleted
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

Creep.prototype.stateRepairEnergy = function () {
    // Find roads that need repair
    let roads = this.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType === STRUCTURE_ROAD &&
                structure.hits < structure.hitsMax;
        }
    });

    let targetRoad = null;
    if (this.memory.targetRoadId) {
        targetRoad = Game.getObjectById(this.memory.targetRoadId);
    }

    // If the previous target road is no longer valid, or it's the first time, find a new target
    if (!targetRoad || targetRoad.hits === targetRoad.hitsMax) {
        targetRoad = roads.length > 0 ? roads[random(0, roads.length - 1)] : null;
        this.memory.targetRoadId = targetRoad ? targetRoad.id : null;
    }

    // If a valid target road is found, proceed to repair it
    if (targetRoad) {
        if (this.repair(targetRoad) === ERR_NOT_IN_RANGE) {
            this.moveTo(targetRoad, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    } else {
        // If no roads need repair, transition to another state (e.g., harvesting)
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
};}
