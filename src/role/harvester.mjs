import {STATES} from "../fsm/constants.mjs";
import {stateDeliverEnergy, stateHarvestEnergy, stateLootEnergy} from "../fsm/workingStates.mjs";

export const runHarvester = function (creep) {
    switch (creep.memory.state) {
        case STATES.HARVESTING_ENERGY:
            stateHarvestEnergy(creep);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.DELIVERING_ENERGY;
                creep.say("🛒");
            }
            break;
        case STATES.DELIVERING_ENERGY:
            stateDeliverEnergy(creep);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.HARVESTING_ENERGY;
                creep.say("⛏️");
            }
            break;
        case STATES.LOOTING_ENERGY:
            stateLootEnergy(creep);
            break;
        default:
            creep.memory.state = STATES.HARVESTING_ENERGY;
    }
}
