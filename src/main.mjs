import "./extensions/creepExtension.mjs";
import {runHarvester} from "./role/harvester.mjs";
import {runUpgrader} from "./role/upgrader.mjs";
import {runBuilder} from "./role/builder.mjs";
import {runFighter} from "./role/fighter.mjs";

const harvesterParts = [WORK,WORK, CARRY, CARRY, MOVE, MOVE];
const workerParts = [WORK,WORK, CARRY,CARRY, MOVE, MOVE];
const renamerParts = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
const fighterParts = [ATTACK,ATTACK, MOVE, MOVE];

module.exports.loop = function () {
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    var fighters = _.filter(Game.creeps, (creep) => creep.memory.role === 'fighter');
    var renamers = _.filter(Game.creeps, (creep) => creep.memory.role === 'renamer');

    // Stuff
    for(const name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // Spawner
    if (renamers.length !== 0)
    {const newName = 'Renamer' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(renamerParts, newName,
            {memory: {role: 'renamer'}});
    }
    if(harvesters.length < 5) {
        const newName = 'Harvester' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(harvesterParts, newName,
            {memory: {role: 'harvester'}});
    }
    if(upgraders.length < 6) {
        const newName = 'Upgrader' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(workerParts, newName,
            {memory: {role: 'upgrader'}});
    }
    if(builders.length < 10 && harvesters.length >= 4 && upgraders.length >= 2 ) {
        const newName = 'Builder' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(workerParts, newName,
            {memory: {role: 'builder'}});
    }
    if(fighters.length < 0) {
        const newName = 'Fighter' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(fighterParts, newName, {
            memory: { role: 'fighter', targetRoom: 'W2N1'}});
    }
    if(Game.spawns['Spawn1'].spawning) {
        const spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            {align: 'left', opacity: 0.8});
    }


    // Creeps
    for(const name in Game.creeps) {
        const creep = Game.creeps[name];
        if(creep.memory.role === 'harvester') {
            runHarvester(creep);
        }
        if(creep.memory.role === 'upgrader') {
            runUpgrader(creep);
        }
        if(creep.memory.role === 'builder') {
            runBuilder(creep);
        }
        if(creep.memory.role === 'fighter') {
            runFighter(creep);
        }
    }

    const tower = Game.getObjectById('65b3b5cd85e04a08b5376477');
    if (tower) {
        const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (closestHostile) {
            tower.attack(closestHostile);
        } else {
            const damagedWalls = tower.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    if (structure.structureType === STRUCTURE_WALL && structure.hits < structure.hitsMax * 0.50) {
                        return true;
                    } else if (structure.structureType === STRUCTURE_ROAD && structure.hits < structure.hitsMax * 0.90) {
                        return true;
                    }
                    return false;
                }
            });

            if (damagedWalls.length > 0) {
                const lowestWall = damagedWalls.reduce((lowest, structure) => {
                    return (lowest && lowest.hits < structure.hits) ? lowest : structure;
                }, null);

                if (lowestWall) {
                    tower.repair(lowestWall);
                }
            }
        }
    }
}
