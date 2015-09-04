

Spawn.prototype.spawn = function(body, bodyParts) {
    var result = this.createCreep(bodyParts);
    if(_.isString(result)) {
        this.room.logCompact('Spawning: ' + result + " with Body: " + bodyParts 
                + " / new sum: " + (this.room.creeps.length + 1));
        if (body == BODY_RANGER) Memory.creeps[result].role = 'guard';
        Memory.creeps[result].body = body;
    } else {
        if (result != ERR_BUSY)
            this.room.logCompact('Spawn error: ' + result 
                + ' while try to spawn ' + JSON.stringify(bodyParts));
    }
}

Spawn.prototype.spawnDefault = function() {
    var bodyParts;
    if (
        this.room.creepsHarvester.length >= 1
        && this.room.extensions.length >= 9
    ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsHarvester.length >= 1
        && this.room.extensions.length >= 5 
    ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsHarvester.length >= 1
        && this.room.extensions.length >= 4
    ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsHarvester.length >= 1
        && this.room.extensions.length >= 2
    ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if ( this.room.creepsHarvester.length >= 1 ) {
        bodyParts = [WORK, CARRY, MOVE, MOVE];
    } else {
        bodyParts = [WORK, CARRY, MOVE];
    }
    this.spawn(BODY_DEFAULT, bodyParts);
}

Spawn.prototype.spawnHarvester = function() {
    var bodyParts;
    if (this.room.extensions.length >= 8)
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE ];
    else if (this.room.extensions.length >= 6)
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE ];
    else if (this.room.extensions.length >= 5)
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, MOVE ];
    var r = this.spawn(BODY_HARVESTER, bodyParts);
    if (r === ERR_NOT_ENOUGH_ENERGY && this.room.creepsDefault.length < 1) {
        this.spawnDefault();
    }
}

Spawn.prototype.spawnUpgrader = function() {
    var bodyParts;
    if (this.room.extensions.length >= 40 && this.room.getCreepsUpgraderCnt() > 2)
        bodyParts = [ 
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            MOVE, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE //350
        ];
    else if (this.room.extensions.length >= 30 && this.room.getCreepsUpgraderCnt() > 1)
        bodyParts = [ 
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            MOVE, MOVE, MOVE, CARRY, MOVE, CARRY, MOVE //350
        ];
    else if (this.room.extensions.length >= 20)
        bodyParts = [ 
            WORK, WORK, WORK, WORK, WORK, //500
            WORK, WORK, WORK, WORK, WORK, //500
            MOVE, MOVE, MOVE, MOVE, CARRY, MOVE //300
        ];
    this.spawn(BODY_UPGRADER, bodyParts);
}

Spawn.prototype.spawnCarrier = function() {
    var bodyParts;
    /*if (this.room.extensions.length >= 20)
        bodyParts = [ 
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE  //100
        ];
    else */
    if (this.room.extensions.length >= 10)
        bodyParts = [ 
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE  //200
        ];
    else if (this.room.extensions.length >= 5)
        bodyParts = [ 
            CARRY, MOVE, CARRY, MOVE, CARRY, MOVE,  //300
            CARRY, MOVE, CARRY, MOVE  //200
        ];
    else
        bodyParts = [ CARRY, MOVE, CARRY, MOVE, CARRY, MOVE ];  //300
    this.spawn(BODY_CARRIER, bodyParts);
}

Spawn.prototype.spawnCarrierTiny = function() {
    var bodyParts = [ CARRY, MOVE ];
    this.spawn(BODY_CARRIER_TINY, bodyParts);
}

Spawn.prototype.spawnHealer = function() {
    var bodyParts;
    if (this.room.extensions.length >= 20) {
        bodyParts = [
            HEAL, MOVE, //250
            HEAL, MOVE, //250
            HEAL, MOVE, //250
            HEAL, MOVE //250
        ];
    } else {
        bodyParts = [MOVE, HEAL];
    }
    this.spawn(BODY_HEALER, bodyParts);
}

Spawn.prototype.spawnRanger = function() {
    var bodyParts;
    if (false && this.room.extensions.length >= 40) { // max: 2300
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
    } else if (this.room.extensions.length >= 30) { // max: 1800
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
    } else if (this.room.extensions.length >= 20) { // max: 1300
        bodyParts = [
            TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, // 300
            RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE, //200
                RANGED_ATTACK, MOVE  //200
        ]; // sum: 1300
    } else {
        this.logError("can't create ranger");
    }
    this.spawn(BODY_RANGER, bodyParts);
}