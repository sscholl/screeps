// include all creep files
#include "CCreepBodyDefault.js"

#include "CCreepXUpgrader.js"

#include "CCreepXGuard.js"
#include "CCreepXHealer.js"

// ########### GENERAL SECTION #########################################

Creep.prototype.run = function() {
    var body = this.memory.body;
    if (body === BODY_DEFAULT)          this.runDefault();
    else if (body === BODY_HARVESTER)   this.runDefault();
    else if (body === BODY_UPGRADER)    this.runUpgrader();
    else if (body === BODY_CARRIER)     this.runDefault();
    else if (body === BODY_CARRIER_TINY)this.runDefault();
    else if (body === BODY_UPGRADER)    this.runUpgrader();
    else if (body === BODY_HEALER)      this.runHealer();
    else if (body === BODY_RANGER)      this.runRanger();
    else                                this.logError("has no body type");
}

// ########### MOVE SECTION ###########################################

Creep.prototype.movePredefined = function(targetPos, opts, onPos) {
    if (!this.pos.inRangeTo(targetPos, 1) || onPos) {
        if (!opts) opts = {};
        opts.reusePath = 6;
        opts.avoid = this.room.getUnsavePostions();
        var result = this.moveTo(targetPos, opts);
        if (result === ERR_NO_PATH) {
            opts.ignoreCreeps = true;
            result = this.moveTo(targetPos, opts);
            if (result === ERR_NO_PATH) {
                LOG_DEBUG(result);
                this.moveRandom();
            }
        }
    }
}

Creep.prototype.getBodyType = function() {
    return this.memory.body;
}

Creep.prototype.moveAround = function() {
    if (this.pos.x === 1)  this.move(RIGHT);
    else if (this.pos.x === 48) this.move(LEFT);
    else if (this.pos.y === 1)  this.move(BOTTOM);
    else if (this.pos.y === 48) this.move(TOP);
    else this.move(Game.time % 8 + 1);
}

Creep.prototype.moveRandom = function() {
    this.move(Math.floor(Math.random() * 8) % 8 + 1);
}

// ########### ENERGY SECTION ###########################################

Creep.prototype.fillOnStructure = function(structure) {
    if (structure instanceof StructureLink) {
        this.movePredefined(structure.pos);
        structure.transferEnergy(this);
    } else if (structure instanceof StructureStorage) {
        this.movePredefined(structure.pos);
        structure.transfer(this, RESOURCE_ENERGY);
    } else {
        this.logError("this structure is not available");
    }
}

Creep.prototype.fillStructure = function(structure) {
    if (structure instanceof StructureStorage || structure instanceof StructureLink || structure instanceof StructureSpawn || structure instanceof StructureExtension) {
        this.movePredefined(structure.pos);
        this.transfer(structure, RESOURCE_ENERGY);
    } else {
        this.logError("this structure is not available");
    }
}

// ########### OTHER SECTION ############################################
Creep.prototype.logCompact = function(message) {
    logCompact('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logDetail = function(message) {
    logDetail('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logError = function(message) {
    logError('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
