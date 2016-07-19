"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

module.exports = function () {
    if ( Spawn._initDebug !== true ) {
        Spawn._initDebug = true;
        var methods = ['spawn', 'spawnDefault', 'spawnHarvester', 'spawnUpgrader', 'spawnCarrier', 'spawnCarrierTiny', 'spawnHealer', 'spawnRanger'];
        for (var i in methods) {
            Profiler._.wrap('Spawn', Spawn, methods[i]);
            Logger._.wrap('Spawn', Spawn, methods[i]);
        }
    }
}

Spawn.prototype.spawn = function(body, bodyParts) {
    var result = this.createCreep(bodyParts);
    if(_.isString(result)) {
        this.room.log('Spawning: ' + result + " with Body: " + bodyParts
                + " / new sum: " + (this.room.creeps.length + 1));
        if (body == 'BODY_RANGER') Memory.creeps[result].role = 'guard';
        Memory.creeps[result].body = body;
    } else {
        if (result != ERR_BUSY)
            this.room.log('Spawn error: ' + result
                + ' while try to spawn ' + bodyParts);
    }
    return result;
}

Spawn.prototype.spawnDefault = function() {
    var bodyParts;
    if ( this.room.hasEnergy(750) ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if ( this.room.hasEnergy(550) ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if ( this.room.hasEnergy(500) ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    } else if ( this.room.hasEnergy(400) ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if ( this.room.creepsDefault.length >= 1 ) {
        bodyParts = [WORK, CARRY, MOVE, MOVE];
    } else {
        bodyParts = [WORK, CARRY, MOVE];
    }
    this.spawn('BODY_DEFAULT', bodyParts);
    var r = this.spawn('BODY_DEFAULT', bodyParts);
    if (r === ERR_NOT_ENOUGH_ENERGY ) {
        this.room.log("can't create default creep");
    }
}

Spawn.prototype.spawnHarvester = function() {
    var bodyParts;
    if ( this.room.hasEnergyCapacitySave(800) ) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE ];
    } else if ( this.room.hasEnergyCapacitySave(600) ) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE ];
    } else if ( this.room.hasEnergyCapacitySave(550) ) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, MOVE ];
    } else if ( this.room.hasEnergyCapacitySave(450) ) {
        bodyParts = [ WORK, WORK, WORK, WORK, MOVE ];
    } else if ( this.room.hasEnergyCapacitySave(350) ) {
        bodyParts = [ WORK, WORK, WORK, MOVE ];
    } else if ( this.room.hasEnergyCapacitySave(250) ) {
        bodyParts = [ WORK, WORK, MOVE ];
    } else {
        this.room.log("can't create harvester - not enough energy");
        if ( this.room.creepsDefault.length < 1 )
            this.spawnDefault();
        return;
    }
    var r = this.spawn('BODY_HARVESTER', bodyParts);
    if ( r === ERR_NOT_ENOUGH_ENERGY ) {
        this.room.log("can't create harvester - not enough energy");
    }
    return r;
}

Spawn.prototype.spawnCarrier = function() {
    var bodyParts;
    if ( false && this.room.hasEnergyCapacitySave(1300) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE  //100
        ];
    else if ( false && this.room.hasEnergyCapacitySave(1000) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE  //100
        ];
    else if ( this.room.hasEnergyCapacitySave(800) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE  //200
        ];
    else if ( this.room.hasEnergyCapacitySave(500) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE  //200
        ];
    else
        bodyParts = [ CARRY, MOVE, CARRY, MOVE, CARRY, MOVE ];  //300
    this.spawn('BODY_CARRIER', bodyParts);
}

Spawn.prototype.spawnCarrierTiny = function() {
    var bodyParts = [ CARRY, MOVE ];
    this.spawn('BODY_CARRIER_TINY', bodyParts);
}

Spawn.prototype.spawnUpgrader = function() {
    var bodyParts;
    if ( this.room.hasEnergyCapacitySave(2100) && this.room.getCreepsUpgraderCnt() > 3 ) {
        bodyParts = [
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            CARRY, MOVE //100
        ];
    } else if ( this.room.hasEnergyCapacitySave(1600) && this.room.getCreepsUpgraderCnt() > 2 ) {
        bodyParts = [
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            CARRY, MOVE //100
        ];
    } else if ( this.room.hasEnergyCapacitySave(1100) && this.room.getCreepsUpgraderCnt() > 1 ) {
        bodyParts = [
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            CARRY, MOVE //100
        ];
    } else if ( this.room.hasEnergyCapacitySave(800) ) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE ]; //800
    } else if ( this.room.hasEnergyCapacitySave(500) ) {
        bodyParts = [ WORK, WORK, WORK, WORK, CARRY, MOVE ]; //500
    } else if ( this.room.hasEnergyCapacitySave(400) ) {
        bodyParts = [ WORK, WORK, WORK, CARRY, MOVE ]; //400
    } else if ( this.room.hasEnergyCapacitySave(300) ) {
        bodyParts = [ WORK, WORK, CARRY, MOVE ]; //300
    } else {
        this.room.logError("can't create upgrader");
    }
    this.spawn('BODY_UPGRADER', bodyParts);
}

Spawn.prototype.spawnHealer = function() {
    var bodyParts;
    if (this.room.hasEnergyCapacitySave(1000)) {
        bodyParts = [
            HEAL, MOVE, HEAL, MOVE, HEAL, MOVE, HEAL, MOVE //1000
        ];
    } else if (this.room.hasEnergyCapacitySave(500)) {
        bodyParts = [
            HEAL, MOVE, HEAL, MOVE //500
        ];
    } else {
        bodyParts = [MOVE, HEAL];
    }
    this.spawn('BODY_HEALER', bodyParts);
}

Spawn.prototype.spawnRanger = function() {
    var bodyParts;
    if (false && this.room.hasEnergyCapacitySave(2300)) { // max: 2300
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, // 300
            RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
            RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE  //200
        ]; // sum: 2300
    } else if (this.room.hasEnergyCapacitySave(1700)) { // max: 1700
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, // 300
            RANGED_ATTACK, MOVE, //200
            RANGED_ATTACK, MOVE, //200
            RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE  //200
        ]; // sum: 1700
    } else if (this.room.hasEnergyCapacitySave(1300)) { // max: 1300
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, // 300
            RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE  //200
        ]; // sum: 1300
    } else {
        bodyParts = [
                RANGED_ATTACK, MOVE, TOUGH, MOVE  //300
        ];
    }
    this.spawn('BODY_RANGER', bodyParts);
}
