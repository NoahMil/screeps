import {STATES} from "./constants.mjs";

export const stateHarvestEnergy = function (creep) {
    const sources = creep.room.find(FIND_SOURCES);
    let targetSource = null;
    if (creep.memory.targetSourceId) {
        targetSource = Game.getObjectById(creep.memory.targetSourceId);
    }
    if (!targetSource) {
        targetSource = sources[Math.floor(Math.random() * sources.length)];
        creep.memory.targetSourceId = targetSource.id;
    }

    if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetSource, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.targetSourceId = null;
        switch (creep.memory.role) {
            case 'harvester':
                creep.memory.state = STATES.DELIVERING_ENERGY;
                creep.say("🛒");
                break;
            case 'builder':
                if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                    creep.memory.targetSourceId = null;
                    // First check for construction sites
                    const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
                    if (constructionSites.length) {
                        creep.memory.state = STATES.BUILDING_ENERGY;
                        creep.say("🧱");
                    } else {
                        // Then transition to delivering energy
                        creep.memory.state = STATES.DELIVERING_ENERGY;
                        creep.say("🛒");
                        break;
                    }
                }
                break;
        }
    }

}

export const stateDeliverEnergy = function (creep) {
    var deliverySpots = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_TOWER || structure.structureType === STRUCTURE_EXTENSION) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });

    // Proceed to transfer energy to a random delivery spot
    if (deliverySpots.length > 0) {
        const randomIndex = Math.floor(Math.random() * deliverySpots.length);
        const randomDeliverySpot = deliverySpots[randomIndex];
        if (randomDeliverySpot && creep.transfer(randomDeliverySpot, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            creep.moveTo(randomDeliverySpot, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }

    // Check if the creep's energy is depleted and change state accordingly
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.state = STATES.HARVESTING_ENERGY;
        creep.say("⛏️");
    } else {
        const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES, {
            filter: (resource) => {
                return resource.resourceType === RESOURCE_ENERGY;
            }
        });
        if (droppedResources.length > 0) {
            creep.memory.state = STATES.LOOTING_ENERGY;
        }
    }
};


export const stateLootEnergy = function (creep) {
    const droppedResources = creep.room.find(FIND_DROPPED_RESOURCES, {
        filter: (resource) => {
            return resource.resourceType === RESOURCE_ENERGY;
        }
    });

    if (droppedResources.length > 0) {
        const closestDroppedResource = creep.pos.findClosestByPath(droppedResources);
        if (closestDroppedResource && creep.pickup(closestDroppedResource) === ERR_NOT_IN_RANGE) {
            creep.moveTo(closestDroppedResource, {visualizePathStyle: {stroke: '#ffaa00'}});
        }
    }

    // Transition to Delivering if storage is full
    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.state = STATES.DELIVERING_ENERGY;
        creep.say("🛒");
    }
    // Transition to Harvesting if no dropped resources and storage is not full
    else if (droppedResources.length === 0 && creep.store.getUsedCapacity(RESOURCE_ENERGY) > 0) {
        creep.memory.state = STATES.HARVESTING_ENERGY;
        creep.say("⛏️");
    }
};

export const stateBuildEnergy = function (creep) {
    const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
    if (constructionSites.length > 0) {
        const targetSite = constructionSites[0];
        if (creep.build(targetSite) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetSite, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.state = STATES.HARVESTING_ENERGY;
        creep.say("⛏️");
    }
};

export const stateUpgradeEnergy = function (creep) {
    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller);
    }
};

export const stateRepairEnergy = function (creep) {
    let targetRoad = Game.getObjectById(creep.memory.targetRoadId);

    if (!targetRoad || targetRoad.hits === targetRoad.hitsMax) {
        let roads = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax;
            }
        });

        if (roads.length > 0) {
            targetRoad = roads[0];
            creep.memory.targetRoadId = targetRoad.id;
        }
    }

    if (targetRoad) {
        if (creep.repair(targetRoad) === ERR_NOT_IN_RANGE) {
            creep.moveTo(targetRoad, {visualizePathStyle: {stroke: '#ffaa00'}});
        }

        // Check if the road is fully repaired
        if (targetRoad.hits === targetRoad.hitsMax) {
            delete creep.memory.targetRoadId;
            // Check for construction sites
            const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
            if (constructionSites.length) {
                creep.memory.state = STATES.BUILDING_ENERGY;
                creep.say("🧱");
            } else {
                creep.memory.state = STATES.HARVESTING_ENERGY;
                creep.say("⛏️");
            }
        }
    } else {
        delete creep.memory.targetRoadId;
        creep.memory.state = STATES.HARVESTING_ENERGY;
        creep.say("⛏️");
    }

    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
        delete creep.memory.targetRoadId;
        creep.memory.state = STATES.HARVESTING_ENERGY;
        creep.say("⛏️");
    } else {
        // Check for construction sites before deciding the next state
        const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if (constructionSites.length) {
            creep.memory.state = STATES.BUILDING_ENERGY;
            creep.say("🧱");
        } else if (!targetRoad || targetRoad.hits === targetRoad.hitsMax) {
            creep.memory.state = STATES.HARVESTING_ENERGY;
            creep.say("⛏️");
        }
    }
};

export const stateFighting = function (creep) {
    // Replace 'TargetFlag' with the name of your flag
    let flag = Game.flags['ATTACK'];

    // Check if the flag exists
    if (!flag) {
        console.log('Flag not found: ATTACK');
        // Handle the situation when the flag is not found
        return;
    }

    // Move to the flag's room if not already there
    if (!flag.room || creep.room.name !== flag.room.name) {
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#ff0000'}});
        return;
    }

    // Find the closest enemy in the room
    let closestEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    // If there are no enemies, move to the flag's position
    if (!closestEnemy) {
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#ff0000'}});
        return;
    }

    // Try to retrieve the targeted enemy from memory
    let target = Game.getObjectById(creep.memory.targetId);

    // If the targeted enemy doesn't exist or is dead, update the target to the closest enemy
    if (!target || target.hits <= 0) {
        creep.memory.targetId = closestEnemy.id;
        target = closestEnemy;
    }

    creep.attackOrMove(target);

    // Clear the memory if no target is found
    if (!target) {
        delete creep.memory.targetId;
    }
};