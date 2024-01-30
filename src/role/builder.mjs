import {STATES} from "../fsm/constants.mjs";
import {stateBuildEnergy, stateDeliverEnergy, stateHarvestEnergy, stateRepairEnergy} from "../fsm/workingStates.mjs";

export const runBuilder = function (creep) {
    switch (creep.memory.state) {
        case STATES.HARVESTING_ENERGY:
            stateHarvestEnergy(creep);
            break;
        case STATES.BUILDING_ENERGY:
            stateBuildEnergy(creep);
            break;
        case STATES.REPAIRING_ENERGY:
            stateRepairEnergy(creep);
            break;
        case STATES.DELIVERING_ENERGY:
            stateDeliverEnergy(creep);
            break;
        default:
            creep.memory.state = STATES.HARVESTING_ENERGY;
            console.log(creep.name + ' (Builder) - Switching to default state: Harvesting Energy');

    }
}

