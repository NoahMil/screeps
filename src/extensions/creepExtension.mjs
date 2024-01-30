/**
 * Attack or move a target
 * @param {Creep | Structure} target
 */
Creep.prototype.attackOrMove = function (target) {
    if (this.attack(target) === ERR_NOT_IN_RANGE) {
        this.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
    }
}




