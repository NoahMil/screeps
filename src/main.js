require('extensions.creepExtension');

var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleFighter = require('role.fighter');
var roleRenamer = require('role.renamer');


const workerParts = [WORK,WORK, CARRY, MOVE];
const renamerParts = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
const fighterParts = [ATTACK,MOVE];

module.exports.loop = function () {
    var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role === 'harvester');
    var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role === 'upgrader');
    var builders = _.filter(Game.creeps, (creep) => creep.memory.role === 'builder');
    var fighters = _.filter(Game.creeps, (creep) => creep.memory.role === 'fighter');
    var renamers = _.filter(Game.creeps, (creep) => creep.memory.role === 'renamer');


    // Stuff
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    // Spawner
    if (renamers.length !== 0)
    {var newName = 'Renamer' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(renamerParts, newName,
            {memory: {role: 'renamer'}});
    }
    if(harvesters.length < 2) {
        var newName = 'Harvester' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(workerParts, newName,
            {memory: {role: 'harvester'}});
    }
    if(upgraders.length < 2) {
        var newName = 'Upgrader' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(workerParts, newName,
            {memory: {role: 'upgrader'}});
    }
    if(builders.length < 8 && harvesters.length >= 2 && upgraders.length >= 1 ) {
        var newName = 'Builder' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(workerParts, newName,
            {memory: {role: 'builder'}});
    }
    if(fighters.length < 0) {
        var newName = 'Fighter' + Game.time;
        Game.spawns['Spawn1'].spawnCreep(fighterParts, newName,
            {memory: {role: 'fighter'}});
    }
    if(Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '🛠️' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            {align: 'left', opacity: 0.8});
    }


    // Creeps
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role === 'harvester') {
            creep.runHarvester();
        }
        if(creep.memory.role === 'upgrader') {
            creep.runUpgrader(creep);
        }
        if(creep.memory.role === 'builder') {
            creep.runBuilder(creep);
        }
        if(creep.memory.role === 'fighter') {
            roleFighter.run(creep);
        }
        if(creep.memory.role === 'renamer') {
            roleRenamer.run(creep);
        }
    }


}