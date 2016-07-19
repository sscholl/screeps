"use strict";

let Logger = require('Logger');
let Profiler = require('Profiler');

module.exports = function () {
    if ( Creep._initDebugGuard !== true ) {
        Creep._initDebugGuard = true;
        let methods = [];
        for (let i in methods) {
            Profiler._.wrap('Creep', Creep, methods[i]);
            Logger._.wrap('Creep', Creep, methods[i]);
        }
    }
}

// ########### GENERAL SECTION #########################################

Creep.prototype.generalActionGuard = function() {
    
    let target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(HEAL) > 0 ;
    }});
    
    if (target instanceof Creep) {
        this.attackRoutine(target);
    } else {
        let target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ;
        }});
        if (target instanceof Creep) {
            this.attackRoutine(target);
        } else {
            let target = this.pos.findClosestByPath(this.room.getHostileCreeps());
            if (target instanceof Creep) {
                this.attackRoutine(target);
            } else {
                let flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_RED } });
                if ( flag instanceof Flag ) {
                    let structures = flag.pos.lookFor(LOOK_STRUCTURES);
                    if (structures.length && structures[0] instanceof Structure) {
                        this.attackRoutine(structures[0]);
                    } else {
                        flag.remove();
                    }
                } else {
                    return false;
                }
            }
        }
    }
    return true;
}

Creep.prototype.generalActionRanger = function () {
    
    let target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(HEAL) > 0 ;
    }});
    
    if (target instanceof Creep) {
        this.attackRoutine(target);
    } else {
        let target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
            return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ;
        }});
        if (target instanceof Creep) {
        this.attackRoutine(target);
        } else {
            let target = this.pos.findClosestByPath(this.room.getHostileCreeps());
            if (target instanceof Creep) {
            this.attackRoutine(target);
            } else {
                let flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_RED } });
                if ( flag instanceof Flag ) {
                    let structures = flag.pos.lookFor(LOOK_STRUCTURES);
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
    }
    return true;
}

Creep.prototype.runGuard = function() {
    let target = this.pos.findClosestByPath(this.room.getHostileCreeps(), {filter: function (object) {
        return object.getActiveBodyparts(ATTACK) > 0 || object.getActiveBodyparts(RANGED_ATTACK) > 0 ;
    }});
    if (target instanceof Creep) {
        this.attackRoutine(target);
    } else {
        let target = this.pos.findClosestByPath(this.room.getHostileCreeps());
        if (target instanceof Creep) {
            this.attackRoutine(target);
        } else {
            let flag = this.pos.findClosestByRange(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_RED } });
            if ( flag instanceof Flag ) {
                let structures = flag.pos.lookFor(LOOK_STRUCTURES);
                if (structures.length && structures[0] instanceof Structure) {
                    this.attackRoutine(structures[0]);
                } else {
                    flag.remove();
                }
            } else if ( this.currentTask ) {
                this.taskMoveAndStay();
            } else {
                let collectionPoint = Game.flags[this.room.name + '_M'];
                if (collectionPoint)
                    this.moveTo(collectionPoint);
            }
    
            delete this.memory.currentTargetId;
        }
    }
}

Creep.prototype.attackRoutine = function(target) {
    if ( this.hits < this.hitsMax * 0.3)
        this.moveTo(this.room.centerPos);
    //else if (!this.pos.inRangeTo(target, 3))
        this.moveTo(target);
    this.attack(target);
    this.rangedAttack(target);
    this.memory.currentTargetId = target.id;
}