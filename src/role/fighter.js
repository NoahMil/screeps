var roleFighter = {

    /** @param {Creep} creep **/
    run: function(creep) {
        const target = creep.pos.findClosestByRange(FIND_STRUCTURES,
            {filter: {structureType: STRUCTURE_WALL}});
        if(target) {
            if(creep.dismantle(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target);
            }
        }
    }
};

module.exports = roleFighter;