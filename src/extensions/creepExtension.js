global.STATE_HARVESTING_ENERGY = 'harvesting_energy';
global.STATE_DELIVERING_ENERGY = 'delivering_energy';
global.STATE_LOOTING_ENERGY = 'looting_energy';
global.STATE_BUILDING_ENERGY = 'building_energy';
global.STATE_UPGRADING_ENERGY = 'upgrading_energy'
global.STATE_REPAIRING_ENERGY = 'repairing_energy'
global.STATE_FIGHTING = 'fighting';

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
};

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
};

Creep.prototype.stateBuildEnergy = function () {
    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length > 0) {
        const targetSite = constructionSites[0];
        if (this.build(targetSite) === ERR_NOT_IN_RANGE) {
            this.moveTo(targetSite, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    } else {
        // Transition to repairing only if there are no construction sites
        this.memory.state = global.STATE_REPAIRING_ENERGY;
        this.say("🔧");
    }

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
};

Creep.prototype.stateUpgradeEnergy = function () {
    if (this.upgradeController(this.room.controller) === ERR_NOT_IN_RANGE) {
        this.moveTo(this.room.controller);
    }

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }
};

Creep.prototype.stateRepairEnergy = function () {
    let targetRoad = Game.getObjectById(this.memory.targetRoadId);

    if (!targetRoad || targetRoad.hits === targetRoad.hitsMax) {
        let roads = this.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax;
            }
        });

        if (roads.length > 0) {
            targetRoad = roads[0];
            this.memory.targetRoadId = targetRoad.id;
        }
    }

    if (targetRoad) {
        if (this.repair(targetRoad) === ERR_NOT_IN_RANGE) {
            this.moveTo(targetRoad, {visualizePathStyle: {stroke: '#ffaa00'}});
        }

        // Check if the road is fully repaired
        if (targetRoad.hits === targetRoad.hitsMax) {
            delete this.memory.targetRoadId;
            // Check for construction sites
            const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
            if (constructionSites.length) {
                this.memory.state = global.STATE_BUILDING_ENERGY;
                this.say("🧱");
            } else {
                this.memory.state = global.STATE_HARVESTING_ENERGY;
                this.say("⛏️");
            }
        }
    } else {
        delete this.memory.targetRoadId;
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    }

    if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        delete this.memory.targetRoadId;
        this.memory.state = global.STATE_HARVESTING_ENERGY;
        this.say("⛏️");
    } else {
        // Check for construction sites before deciding the next state
        const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length) {
            this.memory.state = global.STATE_BUILDING_ENERGY;
            this.say("🧱");
        } else if (!targetRoad || targetRoad.hits === targetRoad.hitsMax) {
            this.memory.state = global.STATE_HARVESTING_ENERGY;
            this.say("⛏️");
        }
    }
};

Creep.prototype.stateFighting = function() {
    // Replace 'TargetFlag' with the name of your flag
    let flag = Game.flags['ATTACK'];

    // Check if the flag exists
    if (!flag) {
        console.log('Flag not found: ATTACK');
        // Handle the situation when the flag is not found
        return;
    }

    // Check if the creep is not in the flag's room or if the flag's room is undefined
    if (!flag.room || this.room.name !== flag.room.name) {
        // Move towards the flag's position
        this.moveTo(flag, {visualizePathStyle: {stroke: '#ff0000'}});
        return;
    }

    // Try to retrieve the targeted enemy from memory
    let target = Game.getObjectById(this.memory.targetId);

    // If the targeted enemy doesn't exist or is dead, find a new target
    if (!target || target.hits <= 0) {
        let closestEnemy = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestEnemy) {
            this.memory.targetId = closestEnemy.id;
            target = closestEnemy;
        }
    }

    // If a target is available, attack it
    if (target) {
        if (this.attack(target) === ERR_NOT_IN_RANGE) {
            this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
        }
    } else {
        // Clear the memory if no target is found
        delete this.memory.targetId;
    }
};




