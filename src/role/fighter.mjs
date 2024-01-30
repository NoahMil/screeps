import {STATES} from "../fsm/constants.mjs";
import {stateFighting} from "../fsm/workingStates.mjs";

export const runFighter = function (creep) {
    switch (creep.memory.state) {
        case STATES.FIGHTING:
            stateFighting(creep);
            break;
        default:
            creep.memory.state = STATES.FIGHTING;
    }
}