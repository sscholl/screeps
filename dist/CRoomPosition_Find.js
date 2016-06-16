"use strict";

// ######## Finds - RoomPosition ##############################################
RoomPosition.prototype.findEnemiesInAttackRange = function (opts) {
    return this.findInRange(FIND_HOSTILE_CREEPS, 4, opts);
};
RoomPosition.prototype.findEnemyStructuresInAttackRange = function (opts) {
    return this.findInRange(FIND_HOSTILE_STRUCTURES, 6, opts);
};

RoomPosition.prototype.findClosestEmptyExtension = function (opts) {
    return this.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: function filter(object) {
            return object.structureType === STRUCTURE_EXTENSION && object.energy !== object.energyCapacity;
        }
    });
};
RoomPosition.prototype.findClosestEnergyContainer = function (opts) {
    var spawn = this.findClosestByPath(FIND_MY_SPAWNS, {
        filter: function filter(object) {
            return object.energy > 0;
        }
    });
    var extension = this.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: function filter(object) {
            return object.structureType === STRUCTURE_EXTENSION && object.energy > 0;
        }
    });
    if (spawn) rangeS = this.getRangeTo(spawn);else rangeS = 99999999;
    if (extension) rangeE = this.getRangeTo(extension);else rangeE = 99999999;
    if (!extension && !spawn) return this.findClosestByPath(FIND_MY_SPAWNS);else if (extension && rangeE <= rangeS) return extension;else if (spawn && rangeS <= rangeE) return spawn;else Logger.logDebug("error while findng a energy source");
};

RoomPosition.prototype.findInRangeLink = function (range) {
    return this.findInRange(FIND_MY_STRUCTURES, range, {
        filter: function filter(object) {
            return object.structureType === STRUCTURE_LINK;
        }
    });
};

RoomPosition.prototype.findClosestSearchingDefaultWorker = function () {
    return this.findClosestByPath(FIND_MY_CREEPS, { filter: function filter(creep) {
            return creep.memory.body === 'BODY_DEFAULT' && (creep.memory.phase === undefined || creep.memory.phase === 'PHASE_SEARCH');
        }
    });
};
RoomPosition.prototype.findClosestSearchingHarvester = function () {
    return this.findClosestByPath(FIND_MY_CREEPS, { filter: function filter(creep) {
            return creep.memory.body === 'BODY_HARVESTER' && (creep.memory.phase === undefined || creep.memory.phase === 'PHASE_SEARCH');
        }
    });
};
RoomPosition.prototype.findClosestSearchingUpgrader = function () {
    return this.findClosestByPath(FIND_MY_CREEPS, { filter: function filter(creep) {
            return creep.memory.body === 'BODY_UPGRADER' && (creep.memory.phase === undefined || creep.memory.phase === 'PHASE_SEARCH');
        }
    });
};

RoomPosition.prototype.findClosestCreep = function (_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, { filter: function filter(creep) {
            return creep.memory.body === bodyType && (creep.memory.phase === 'PHASE_SEARCH' || creep.memory.phase === undefined);
        }
    });
};

RoomPosition.prototype.findClosestCreepEmpty = function (_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, { filter: function filter(creep) {
            return creep.memory.body === bodyType && (creep.memory.phase === 'PHASE_SEARCH' || creep.memory.phase === undefined) && creep.carry.energy < 50; //<= creep.carryCapacity * 0.5;
        }
    });
};

RoomPosition.prototype.findClosestCreepFull = function (_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, { filter: function filter(creep) {
            return creep.memory.body === bodyType && (creep.memory.phase === 'PHASE_SEARCH' || creep.memory.phase === undefined) && creep.carry.energy >= 25; //> creep.carryCapacity * 0.25;
        }
    });
};
