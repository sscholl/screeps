

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
        this.room.creepsDefault.length >= this.room.creepsRequired() / 1 
        && this.room.extensions.length >= 9
    ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsDefault.length >= this.room.creepsRequired() / 1.5 
        && this.room.extensions.length >= 6
    ) {
        bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsDefault.length >= this.room.creepsRequired() / 1.75 
        && this.room.extensions.length >= 5
    ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
    } else if (
        this.room.creepsDefault.length >= this.room.creepsRequired() / 2 
        && this.room.extensions.length >= 2
    ) {
        bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    } else if (
        this.room.creepsDefault.length >= this.room.creepsRequired() / 3
    ) {
        bodyParts = [WORK, CARRY, MOVE, MOVE];
    } else {
        bodyParts = [WORK, CARRY, MOVE];
    }
    this.spawn(BODY_DEFAULT, bodyParts);
}

Spawn.prototype.spawnHarvester = function() {
    var bodyParts;
    if (this.room.extensions.length >= 10) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, CARRY, MOVE, CARRY, MOVE ];
    } else if (this.room.extensions.length >= 8) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, MOVE ];
    } else if (this.room.extensions.length >= 5) {
        bodyParts = [ WORK, WORK, WORK, WORK, WORK, MOVE ];
    }
    this.spawn(BODY_HARVESTER, bodyParts);
}

Spawn.prototype.spawnUpgrader = function() {
    var bodyParts = [ WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, MOVE ];
    this.spawn(BODY_UPGRADER, bodyParts);
}

Spawn.prototype.spawnHealer = function() {
    var bodyParts;
    if (this.room.extensions.length >= 20) {
        bodyParts = [ MOVE, MOVE, MOVE,  //4 * 50 = 200
            HEAL, HEAL, HEAL, HEAL, //4 * 200 = 800
            MOVE
        ];
    } else {
        bodyParts = [MOVE, HEAL];
    }
    this.spawn(BODY_HEALER, bodyParts);
}

Spawn.prototype.spawnRanger = function() {
    var bodyParts;
    if (this.room.extensions.length >= 40) {
        bodyParts = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
            TOUGH, TOUGH, TOUGH, TOUGH, 
            // 9 * 10 = 90
            MOVE, MOVE, MOVE, MOVE, MOVE,  
            MOVE, MOVE, MOVE, MOVE,   //9 * 50 = 450
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, //11 * 150 = 1650
            MOVE // 50
        ]; // sum = 2240
    } else if (this.room.extensions.length >= 30) {
        bodyParts = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            TOUGH, TOUGH, TOUGH, // 13 * 10 = 130
            MOVE, MOVE, MOVE, MOVE, MOVE,  
            MOVE, MOVE, MOVE, MOVE,   //9 * 50 = 450
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, //7 * 150 = 1150
            MOVE
        ]; // sum = 1630
    } else if (this.room.extensions.length >= 20) {
        bodyParts = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            MOVE, MOVE, MOVE, MOVE, MOVE,  //5 * 50 = 250
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, //5 * 150 = 750
            MOVE
        ];
    } else {
        this.logError("can't create ranger");
    }
    this.spawn(BODY_RANGER, bodyParts);
}