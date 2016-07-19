"use strict";

var Logger = require('Logger');
var Profiler = require('Profiler');

module.exports = function () {
    if ( Creep._initDebugGuard !== true ) {
        Creep._initDebugGuard = true;
        var methods = [];
        for (var i in methods) {
            Profiler._.wrap('Creep', Creep, methods[i]);
            Logger._.wrap('Creep', Creep, methods[i]);
        }
    }
}

// ########### GENERAL SECTION #########################################

Creep.prototype.generalActionGuard = function() {
    var target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ;
    }});
    if (target instanceof Creep) {
        this.attackMelee(target);
    } else {
        var target = this.pos.findClosestByPath(this.room.getHostileCreeps());
        if (target instanceof Creep) {
            this.attackMelee(target);
        } else {
            var flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_RED } });
            if ( flag instanceof Flag ) {
                var structures = flag.pos.lookFor(LOOK_STRUCTURES);
                if (structures.length && structures[0] instanceof Structure) {
                    this.attackMelee(structures[0]);
                } else {
                    flag.remove();
                }
            } else {
                return false;
            }
        }
    }
    return true;
}

Creep.prototype.generalActionRanger = function () {
    var target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ;
    }});
    if (target instanceof Creep) {
        this.attackRanged(target);
    } else {
        var target = this.pos.findClosestByPath(this.room.getHostileCreeps());
        if (target instanceof Creep) {
            this.attackRanged(target);
        } else {
            var flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_RED } });
            if ( flag instanceof Flag ) {
                var structures = flag.pos.lookFor(LOOK_STRUCTURES);
                if (structures.length && structures[0] instanceof Structure) {
                    this.movePredefined(structures[0], {}, 1);
                    this.rangedAttack(structures[0]);
                } else {
                    flag.remove();
                }
            } else {
                return false;
            }
        }
    }
    return true;
}

Creep.prototype.runGuard = function() {
    var target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ;
    }});
    if (target instanceof Creep) {
        this.attackMelee(target);
    } else {
        var target = this.pos.findClosestByPath(this.room.getHostileCreeps());
        if (target instanceof Creep) {
            this.attackMelee(target);
        } else {
            var flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_RED } });
            if ( flag instanceof Flag ) {
                var structures = flag.pos.lookFor(LOOK_STRUCTURES);
                if (structures.length && structures[0] instanceof Structure) {
                    this.attackMelee(structures[0]);
                } else {
                    flag.remove();
                }
            } else if ( this.getCurrentTask() ) {
                this.taskMoveAndStay();
            } else {
                var collectionPoint = Game.flags[this.room.name + '_M'];
                if (collectionPoint)
                    this.moveTo(collectionPoint);
            }
    
            delete this.memory.currentTargetId;
        }
    }
}

Creep.prototype.attackMelee = function(target) {
    if ( this.hits < this.hitsMax * 0.3 )
        this.moveTo(this.room.centerPos);
    else if ( ! this.pos.inRangeTo(target, 1) )
        this.moveTo(target);
    else
        this.attack(target);
    this.memory.currentTargetId = target.id;
}

Creep.prototype.attackRanged = function(target) {
    if (this.pos.inRangeTo(target, 2) || this.hits < this.hitsMax * 0.3)
        this.moveTo(this.room.centerPos);
    else if (!this.pos.inRangeTo(target, 3))
        this.moveTo(target);
    this.rangedAttack(target);
    this.memory.currentTargetId = target.id;
}