"use strict";

var Logger = require('Logger');

module.exports = function () {
}

// ########### GENERAL SECTION #########################################

Creep.prototype.runRanger = function() {
    var target = this.pos.findClosestByPath(this.room.getHostileCreeps());
    if (target instanceof Creep) {
        if (!this.pos.inRangeTo(target, 3))
            this.movePredefined(target);
        if (this.pos.inRangeTo(target, 2) || this.hits < this.hitsMax * 0.3)
            this.movePredefined(this.room.controller);
        this.rangedAttack(target);
        this.memory.currentTargetId = target.id;
    }
    if ( ! target ) {
        var flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED } });
        if ( flag instanceof Flag ) {
            var structures = flag.pos.lookFor(LOOK_STRUCTURES);
            if (structures.length && structures[0] instanceof Structure) {
                this.movePredefined(structures[0], {}, 3);
                this.rangedAttack(structures[0]);
            } else {
                flag.remove();
            }
        } else {
            var collectionPoint = Game.flags[this.room.name + '_M'];
            if (collectionPoint) {
                this.movePredefined(collectionPoint.pos, {}, 0);
            }
        }

        delete this.memory.currentTargetId;
    }
}
