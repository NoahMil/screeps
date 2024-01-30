import {STATES} from "../fsm/constants.mjs";
import {stateHarvestEnergy, stateUpgradeEnergy} from "../fsm/workingStates.mjs";

export const runUpgrader = function (creep) {
    switch (creep.memory.state) {
        case STATES.HARVESTING_ENERGY:
            stateHarvestEnergy(creep);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.UPGRADING_ENERGY;
                creep.say("📈");
            }
            break;
        case STATES.UPGRADING_ENERGY:
            stateUpgradeEnergy(creep);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.HARVESTING_ENERGY;
                creep.say("⛏️");
            }
            break;
        default:
            creep.memory.state = STATES.HARVESTING_ENERGY;
    }
}