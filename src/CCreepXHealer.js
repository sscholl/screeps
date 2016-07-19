"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

module.exports = function () {
    if ( Creep._initDebugHealer !== true ) {
        Creep._initDebugHealer = true;
        var methods = ['runHealer'];
        for (var i in methods) {
            Profiler._.wrap('Creep', Creep, methods[i]);
            Logger._.wrap('Creep', Creep, methods[i]);
        }
    }
}

// ########### GENERAL SECTION #########################################

Creep.prototype.runHealer = function() {

    var damagedCreep = this.pos.findClosestByPath(FIND_MY_CREEPS, {
        filter: function(object) {
            return object !== this && object.hits < object.hitsMax;
        }
    });
    if (this.hits < this.hitsMax - 50 /* no more heal */) {
        this.moveTo(this.room.defaultSpawn);
        this.heal(damagedCreep);
        this.rangedHeal(damagedCreep);
        return true;
    }

    if(damagedCreep) {
        var hisTarget = Game.getObjectById(damagedCreep.memory.currentTargetId);
        if (hisTarget && this.pos.inRangeTo(hisTarget, 3))
            this.moveTo(this.room.defaultSpawn);
        else
            if (!this.pos.inRangeTo(damagedCreep, 1))
                this.moveTo(damagedCreep);
        this.rangedHeal(damagedCreep);
        this.heal(damagedCreep);
        return true;
    }
    var guard;
    if (this.memory.currentTargetId)
        guard = Game.getObjectById(this.memory.currentTargetId);
    else
        guard = this.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: function(creep) {
                return creep.memory.role === 'guard';
            }
        });
    if (guard) {
        if (!this.pos.inRangeTo(guard, 1))
           this.moveTo(guard);
       this.memory.currentTargetId = guard.id;
    } else {
        return false;
    }
    return true;
}
