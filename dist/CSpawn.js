"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

module.exports = function () {
    if ( Spawn._initDebug !== true ) {
        Spawn._initDebug = true;
        let methods = ['spawn', 'spawnDefault', 'spawnHarvester', 'spawnUpgrader', 'spawnCarrier', 'spawnCarrierTiny', 'spawnHealer', 'spawnRanger'];
        for (let i in methods) {
            Profiler._.wrap('Spawn', Spawn, methods[i]);
            Logger._.wrap('Spawn', Spawn, methods[i]);
        }
    }
}

Spawn.prototype.spawn = function (body, bodyParts, name, memory) {
    let r = null;
    if ( ! name ) name = this.getRandomName();
    if ( this.canCreateCreep(bodyParts, name) === OK ) {
        r = this.createCreep(bodyParts, name, memory);
        if(_.isString(r)) {
            this.room.log('Spawning: ' + r + " with Body: " + bodyParts
                    + " / new sum: " + (this.room.creeps.length + 1));
            Memory.creeps[r].body = body;
        } else {
            this.room.log('Spawn error: ' + r
                    + ' while try to spawn ' + body + ' with parts ' + JSON.stringify(bodyParts));
            r = null;
        }
    }
    return r;
}

Spawn.prototype.spawnDefault = function (name, memory, qtyWork) {
    let bodyParts = [];
    if ( qtyWork && this.room.hasEnergyCapacitySave(200 * qtyWork) ) {
        for (let i = 0; i < qtyWork; ++ i )
            bodyParts = bodyParts.concat([WORK, CARRY, MOVE]);
    } else {
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
    }
    return this.spawn('BODY_DEFAULT', bodyParts, name, memory);
}

Spawn.prototype.spawnHarvester = function (name, memory) {
    let bodyParts = [];
    if ( this.room.hasEnergyCapacitySave(950) ) {
        bodyParts = [ WORK, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE ];
    } else if ( this.room.hasEnergyCapacitySave(800) ) {
        bodyParts = [ WORK, WORK, MOVE, WORK, MOVE, WORK, MOVE, WORK, MOVE, CARRY, MOVE ];
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
            return this.spawnDefault();
    }
    return this.spawn('BODY_HARVESTER', bodyParts, name, memory);
}

Spawn.prototype.spawnCarrier = function (name, memory) {
    let bodyParts = [];
    if ( this.room.hasEnergyCapacitySave(2450) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //500
            WORK, MOVE, //150
        ];
    else if ( this.room.hasEnergyCapacitySave(1450) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, WORK, MOVE, //250
        ];
    else if ( this.room.hasEnergyCapacitySave(1150) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  CARRY, MOVE,  //400
            WORK, MOVE, //150
        ];
    else if ( this.room.hasEnergyCapacitySave(950) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE,  //200
            WORK, MOVE, //150
        ];
    else if ( this.room.hasEnergyCapacitySave(800) )
        bodyParts = [
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //600
            CARRY, MOVE, CARRY, MOVE  //200
        ];
    else if ( this.room.hasEnergyCapacitySave(500) )
        bodyParts = [ CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE ]; //500
    else
        bodyParts = [ CARRY, MOVE, CARRY, MOVE, CARRY, MOVE ];  //300
    return this.spawn('BODY_CARRIER', bodyParts, name, memory);
}

Spawn.prototype.spawnCarrierTiny = function (name, memory) {
    let bodyParts = [ CARRY, MOVE ];
    return this.spawn('BODY_CARRIER_TINY', bodyParts, name, memory);
}

Spawn.prototype.spawnUpgrader = function (name, memory, qtyWork) {
    let bodyParts = [WORK, WORK, CARRY, MOVE];
    for ( let i = 3; i <= qtyWork; ++ i ) {
        if ( this.room.hasEnergyCapacitySave(i * BODYPART_COST[WORK] + BODYPART_COST[MOVE]) ) {
            bodyParts.unshift(WORK); //unshift adds an element in the beginning of the array
            qtyWork = i;
        } else {
            break;
        }
    }
    return this.spawn('BODY_UPGRADER', bodyParts, name, memory);
}

Spawn.prototype.spawnHealer = function (name, memory) {
    let bodyParts = [];
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
    return this.spawn('BODY_HEALER', bodyParts, name, memory);
};

Spawn.prototype.spawnRanger = function (name, memory) {
    let bodyParts = [];
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
    } else if (this.room.hasEnergyCapacitySave(1560)) { // max: 1700
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, // 300
            RANGED_ATTACK, MOVE, //200
            RANGED_ATTACK, MOVE, //200
            RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                ATTACK, MOVE,  //130
                ATTACK, MOVE  //130
        ]; // sum: 1560
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
                TOUGH, MOVE, RANGED_ATTACK, MOVE  //300
        ];
    }
    return this.spawn('BODY_RANGER', bodyParts, name, memory);
}

Spawn.prototype.spawnMelee = function (name, memory, qtyAttack, qtyThough = 0) {
    let bodyParts = [];
    this.room.log(qtyAttack * 90 + qtyAttack * 60);
    if ( qtyAttack && this.room.hasEnergyCapacitySave(qtyAttack * 90 + qtyAttack * 60) ) {
        for (let i = 0; i < qtyThough; ++ i )
            bodyParts = bodyParts.concat([TOUGH, MOVE]);
        for (let i = 0; i < qtyAttack; ++ i )
            bodyParts = bodyParts.concat([ATTACK, MOVE]);
    } else {
        if (this.room.hasEnergyCapacitySave(950)) { // max: 950
            bodyParts = [
                TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, // 300
                ATTACK, MOVE, //130
                    ATTACK, MOVE, //130
                    ATTACK, MOVE, //130
                    ATTACK, MOVE, //130
                    ATTACK, MOVE  //130
            ];
        } else {
            bodyParts = [
                    ATTACK, MOVE, ATTACK, MOVE  //190
            ];
        }
    }
    return this.spawn('BODY_MELEE', bodyParts, name, memory);
}

Spawn.prototype.spawnClaim = function (name, memory, qtyClaim) {
    let bodyParts = [];
    if ( this.room.hasEnergyCapacitySave(qtyClaim * 650) ) {
        for (let i = 0; i < qtyClaim; ++ i )
            bodyParts = bodyParts.concat([CLAIM, MOVE]);
    } else if ( this.room.hasEnergyCapacitySave(650) ) {
        bodyParts = [CLAIM, MOVE];
    }
    return this.spawn('BODY_CLAIM', bodyParts, name, memory);
};

Spawn.prototype.getRandomName = function () {
    let chars = "abcdefghijklmnopqrstufwxyzABCDEFGHIJKLMNOPQRSTUFWXYZ1234567890";
    let pwd = _.sample(chars, 6);
    while ( Memory.creeps[pwd.join("")]) pwd = _.sample(chars, length || 6);
    return pwd.join("");
}
