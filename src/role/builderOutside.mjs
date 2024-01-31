import {STATES} from "../fsm/constants.mjs";
import {
    stateBuildEnergy,
    stateHarvestEnergyAnotherRoom,
} from "../fsm/workingStates.mjs";

export const runBuilderOutside = function (creep) {
    switch (creep.memory.state) {
        case STATES.HARVESTING_ENERGY_ANOTHER_ROOM:
            let flagBuilders = Game.flags['Builders'];
            stateHarvestEnergyAnotherRoom(creep);
            if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.BUILDING_ENERGY;
                creep.say("🧱");
            }
            break;
        case STATES.BUILDING_ENERGY:
            stateBuildEnergy(creep);
            if (creep.store.getUsedCapacity(RESOURCE_ENERGY) === 0) {
                creep.memory.state = STATES.HARVESTING_ENERGY_ANOTHER_ROOM;
                creep.say("⛏️");
            }
            break;
        default:
            creep.memory.state = STATES.HARVESTING_ENERGY_ANOTHER_ROOM;
    }

}