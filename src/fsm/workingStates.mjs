import {STATES} from "./constants.mjs";

export const stateHarvestEnergy = function (creep) {
    // If the creep already has a target source, continue to use it
    let targetSource = null;
    if (creep.memory.targetSourceId) {
        targetSource = Game.getObjectById(creep.memory.targetSourceId);

        // Clear the memory if the source is null (e.g., source depleted)
        if (!targetSource) {
            delete creep.memory.targetSourceId;
        }
    }

    // If the creep doesn't have a target source, find one
    if (!targetSource) {
        const sources = creep.room.find(FIND_SOURCES);
        const creepsAtSources = countCreepsAtSources(_.filter(Game.creeps, (c) => c.memory.role === creep.memory.role), sources);

        // Choose the source with fewer creeps assigned to it
        let leastAssignedSourceIndex = creepsAtSources.indexOf(Math.min(...creepsAtSources));
        targetSource = sources[leastAssignedSourceIndex];
        creep.memory.targetSourceId = targetSource.id;
    }

    // Harvest from the target source
    if (creep.harvest(targetSource) === ERR_NOT_IN_RANGE) {
        creep.moveTo(targetSource, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

    // Update the state to harvesting
    creep.memory.state = STATES.HARVESTING_ENERGY;
};


export const stateDeliverEnergy = function (creep) {
    // Retrieve the target from memory, if it exists
    let target = null;
    if (creep.memory.deliveryTargetId) {
        target = Game.getObjectById(creep.memory.deliveryTargetId);
        // Clear the target from memory if it's no longer valid
        if (!target || target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
            target = null;
            delete creep.memory.deliveryTargetId;
        }
    }

    // If no target in memory, find a new one
    if (!target) {
        var deliverySpots = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType === STRUCTURE_EXTENSION ||
                        structure.structureType === STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        if (deliverySpots.length > 0) {
            // Sort the spots by priority and distance
            deliverySpots.sort((a, b) => {
                const priorityDiff = getStructurePriority(a.structureType) - getStructurePriority(b.structureType);
                if (priorityDiff === 0) {
                    return creep.pos.getRangeTo(a) - creep.pos.getRangeTo(b);
                }
                return priorityDiff;
            });

            target = deliverySpots[0];
            // Save the target in memory for the next tick
            creep.memory.deliveryTargetId = target.id;
        }
    }

    // Proceed to transfer energy to the target
    if (target && creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
    }
};

// Helper function to get priority based on structure type
function getStructurePriority(structureType) {
    switch (structureType) {
        case STRUCTURE_EXTENSION:
            return 1;
        case STRUCTURE_TOWER:
            return 2;
        case STRUCTURE_SPAWN:
            return 3;
        default:
            return 99;
    }
}


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
};

export const stateUpgradeEnergy = function (creep, homeRoomName) {
    if (creep.room.name !== homeRoomName) {
        // Find an exit to the home room
        const exitDir = creep.room.findExitTo(homeRoomName);
        const exit = creep.pos.findClosestByRange(exitDir);
        creep.moveTo(exit);
        return;
    }

    if (creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
        creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
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
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#003cff'}});
        return;
    }

    // Find the closest enemy in the room
    let closestEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

    // If there are no enemies, move to the flag's position
    if (!closestEnemy) {
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#003cff'}});
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

export const stateHarvestEnergyAnotherRoom = function (creep) {
    let flag = Game.flags['Upgraders'];

    // Check if the flag exists
    if (!flag) {
        console.log('Flag not found: Upgraders');
        return;
    }

    // Move to the flag's room if not already there or if the room is not visible
    if (flag.room === undefined || creep.room.name !== flag.room.name) {
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#003cff'}});
        return;
    }

    stateHarvestEnergy(creep);
};


function countCreepsAtSources(creeps, sources) {
    const creepsAtSources = sources.map(() => 0);

    creeps.forEach(creep => {
        if (creep.memory.targetSourceId) {
            const sourceIndex = sources.findIndex(source => source.id === creep.memory.targetSourceId);
            if (sourceIndex !== -1) {
                creepsAtSources[sourceIndex]++;
            }
        }
    });

    return creepsAtSources;
};

export const stateClaimEnergy = function (creep) {
    let flag = Game.flags['Claim'];

    // Check if the flag exists
    if (!flag) {
        console.log('Flag not found: Claim');
        // Handle the situation when the flag is not found
        return;
    }

    // Move to the flag's room if not already there
    if (!flag.room || creep.room.name !== flag.room.name) {
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#003cff'}});
        return;
    }

    if(creep.room.controller) {
        if(creep.claimController(creep.room.controller) === ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller);
        }
    }
};

export const stateExplore = function (creep) {
    let flag = Game.flags['Explore'];

    // Check if the flag exists
    if (!flag) {
        console.log('Flag not found: Claim');
        // Handle the situation when the flag is not found
        return;
    }

    // Move to the flag's room if not already there
    if (!flag.room || creep.room.name !== flag.room.name) {
        creep.moveTo(flag, {visualizePathStyle: {stroke: '#003cff'}});
        return;
    }
};

