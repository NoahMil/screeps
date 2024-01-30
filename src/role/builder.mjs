import {STATES} from "../fsm/constants.mjs";
import {stateBuildEnergy, stateDeliverEnergy, stateHarvestEnergy, stateRepairEnergy} from "../fsm/workingStates.mjs";

export const runBuilder = function (creep) {
    switch (creep.memory.state) {
        case STATES.HARVESTING_ENERGY:
            stateHarvestEnergy(creep);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (constructionSites.length){
                    creep.memory.state = STATES.BUILDING_ENERGY;
                    creep.say("🧱");
                } else {
                    creep.memory.state = STATES.DELIVERING_ENERGY;
                    creep.say("🛒");
                }
            }
            break;

        case STATES.BUILDING_ENERGY:
            stateBuildEnergy(creep);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.HARVESTING_ENERGY;
                creep.say("⛏️");
            }
            break;
        case STATES.REPAIRING_ENERGY:
            stateRepairEnergy(creep);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.HARVESTING_ENERGY;
                creep.say("⛏️");
            } else {
                const constructionSites = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (constructionSites.length) {
                    creep.memory.state = STATES.BUILDING_ENERGY;
                    creep.say("🧱");
                }
            }
            break;
        case STATES.DELIVERING_ENERGY:
            stateDeliverEnergy(creep);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.HARVESTING_ENERGY;
                creep.say("⛏️");
            }
            break;
        default:
            creep.memory.state = STATES.HARVESTING_ENERGY;
    }
}

