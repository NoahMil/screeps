import {STATES} from "../fsm/constants.mjs";
import {stateClaimEnergy} from "../fsm/workingStates.mjs";

export const runClaimer = function (creep) {
    switch (creep.memory.state) {
        case STATES.CLAIMING:
            stateClaimEnergy(creep);
            break;
        default:
            creep.memory.state = STATES.CLAIMING;
    }
}