import {STATES} from "../fsm/constants.mjs";
import {stateDeliverEnergy, stateHarvestEnergy, stateLootEnergy} from "../fsm/workingStates.mjs";

export const runHarvester = function (creep) {
    switch (creep.memory.state) {
        case STATES.HARVESTING_ENERGY:
            stateHarvestEnergy(creep);
            break;
        case STATES.DELIVERING_ENERGY:
            stateDeliverEnergy(creep);
            break;
        case STATES.LOOTING_ENERGY:
            stateLootEnergy(creep);
            break;
        default:
            creep.memory.state = STATES.HARVESTING_ENERGY;
    }
}
