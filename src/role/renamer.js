var roleRenamer = {

    /** @param {Creep} creep **/
    run: function(creep) {


        var SignFlag = Game.flags['ToGo'];
        if (creep && SignFlag) {
            var moveResult = creep.moveTo(SignFlag.pos, {visualizePathStyle: {stroke: '#1fff00'}});
        } else {
            console.log("Le Screep ou le Flag n'a pas été trouvé.");
        }
    }
};

module.exports = roleRenamer;