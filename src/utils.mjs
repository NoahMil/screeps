export const spawn = function(spawnName, role, module)
{
    let creepName = 'unit_' + Game.spawns[spawnName].room.find(FIND_MY_CREEPS).length;
    return Game.spawns[spawnName].spawnCreep(module, creepName, {memory: {role: role}});
}
