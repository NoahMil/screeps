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
                if (this.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    this.memory.targetSourceId = null;
                    // First check for construction sites
                    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
                    if (constructionSites.length) {
                        this.memory.state = global.STATE_BUILDING_ENERGY;
                        this.say("🧱");
                    } else {
                        // Then transition to delivering energy
                        this.memory.state = global.STATE_DELIVERING_ENERGY;
                        this.say("🛒");
                        break;
                    }
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
    var deliverySpots = this.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_TOWER || structure.structureType === STRUCTURE_EXTENSION) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });

    // Proceed to transfer energy to a random delivery spot
    if (deliverySpots.length > 0) {
        const randomIndex = Math.floor(Math.random() * deliverySpots.length);
        const randomDeliverySpot = deliverySpots[randomIndex];
        if (randomDeliverySpot && this.transfer(randomDeliverySpot, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.moveTo(randomDeliverySpot, {visualizePathStyle: {stroke: '#ffffff'}});
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

Creep.prototype.stateFighting = function () {
    // Replace 'TargetFlag' with the name of your flag
    let flag = Game.flags['ATTACK'];

    // Check if the flag exists
    if (!flag) {
        console.log('Flag not found: ATTACK');
        // Handle the situation when the flag is not found
        return;
    }

    // Move to the flag's room if not already there
    if (!flag.room || this.room.name !== flag.room.name) {
        this.moveTo(flag, {visualizePathStyle: {stroke: '#ff0000'}});
        return;
    }

    // Find the closest enemy in the room
    let closestEnemy = this.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    // If there are no enemies, move to the flag's position
    if (!closestEnemy) {
        this.moveTo(flag, {visualizePathStyle: {stroke: '#ff0000'}});
        return;
    }

    // Try to retrieve the targeted enemy from memory
    let target = Game.getObjectById(this.memory.targetId);

    // If the targeted enemy doesn't exist or is dead, update the target to the closest enemy
    if (!target || target.hits <= 0) {
        this.memory.targetId = closestEnemy.id;
        target = closestEnemy;
    }

    // If a target is available, attack it
    if (this.attack(target) === ERR_NOT_IN_RANGE) {
        this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
    }

    // Clear the memory if no target is found
    if (!target) {
        delete this.memory.targetId;
    }
};





