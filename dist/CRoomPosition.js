"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

module.exports = function () {
    if ( RoomPosition._initDebug !== true ) {
        RoomPosition._initDebug = true;
        var methods = ['getSpotsCnt', 'getInRangePositions'];
        for (var i in methods) {
            Profiler._.wrap('RoomPosition', RoomPosition, methods[i]);
            Logger._.wrap('RoomPosition', RoomPosition, methods[i]);
        }
    }
}

Object.defineProperty(RoomPosition.prototype, "energy", { get: function () {
        if (this._energy === undefined) {
            let energys = this.lookFor('energy');
            if ( energys.length && energys[0] )
                this._energy = energys[0];
        }
        return this._energy;
}});

// ######## RoomPosition ##############################################
RoomPosition.prototype.getRoom = function() {
    return Game.rooms[this.roomName];
}

RoomPosition.prototype.getSpotsCnt = function() {
    var cnt = 0;
    var positions = this.getRoom().lookForAtArea('terrain', this.y - 1, this.x - 1, this.y + 1, this.x + 1);

    for (var y in positions) {
        for (var x in positions[y]) {
            var isFree = true;
            for (var i in positions[y][x])
                if (positions[y][x][i] === 'wall') isFree = false;
            if (isFree) ++ cnt;
        }
    }
    return cnt;
};

RoomPosition.prototype.getInRangePositions = function(distance) {
    var poss = new Array(9);
    var i = 0;
    for (var y = this.y - distance; y < this.y + distance; ++ y) {
        for (var x = this.x - distance; x < this.x + distance; ++ x) {
            poss[i ++] = new RoomPosition(x,y,this.roomName);
        }
    }
    return poss;
}


// ######## Finds - RoomPosition ##############################################
RoomPosition.prototype.findEnemiesInAttackRange = function (opts) {
    return this.findInRange(FIND_HOSTILE_CREEPS, 4, opts);
};
RoomPosition.prototype.findEnemyStructuresInAttackRange = function (opts) {
    return this.findInRange(FIND_HOSTILE_STRUCTURES, 6, opts);
};

RoomPosition.prototype.findClosestEmptyExtension = function (opts) {
    return this.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: function (object) {
            return object.structureType === STRUCTURE_EXTENSION && object.energy !== object.energyCapacity;
        }
    });
};
RoomPosition.prototype.findClosestEnergyContainer = function (opts) {
    var spawn = this.findClosestByPath(FIND_MY_SPAWNS, {
        filter: function (object) {
            return object.energy > 0;
        }
    });
    var extension = this.findClosestByPath(FIND_MY_STRUCTURES, {
        filter: function (object) {
            return object.structureType === STRUCTURE_EXTENSION && object.energy > 0;
        }
    });
    if (spawn)
        rangeS = this.getRangeTo(spawn);
    else
        rangeS = 99999999;
    if (extension)
        rangeE = this.getRangeTo(extension);
    else
        rangeE = 99999999;
    if (!extension && !spawn)
        return this.findClosestByPath(FIND_MY_SPAWNS);
    else if (extension && rangeE <= rangeS)
        return extension;
    else if (spawn && rangeS <= rangeE)
        return spawn;
    else
        Logger.logDebug("error while findng a energy source");
};

RoomPosition.prototype.findInRangeLink = function (range) {
    return this.findInRange(FIND_MY_STRUCTURES, range, {
        filter: function (object) {
            return object.structureType === STRUCTURE_LINK
        }
    });
};

RoomPosition.prototype.findClosestSearchingDefaultWorker = function () {
    return this.findClosestByPath(FIND_MY_CREEPS,
            {filter:
                        function (creep) {
                            return creep.memory.body === 'BODY_DEFAULT' && (creep.memory.phase === undefined || creep.memory.phase === 'PHASE_SEARCH');
                        }
            }
    );
}
RoomPosition.prototype.findClosestSearchingHarvester = function () {
    return this.findClosestByPath(FIND_MY_CREEPS,
            {filter:
                        function (creep) {
                            return creep.memory.body === 'BODY_HARVESTER' && (creep.memory.phase === undefined || creep.memory.phase === 'PHASE_SEARCH');
                        }
            }
    );
}
RoomPosition.prototype.findClosestSearchingUpgrader = function () {
    return this.findClosestByPath(FIND_MY_CREEPS,
            {filter:
                        function (creep) {
                            return creep.memory.body === 'BODY_UPGRADER' && (creep.memory.phase === undefined || creep.memory.phase === 'PHASE_SEARCH');
                        }
            }
    );
}


RoomPosition.prototype.findClosestCreep = function (_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, {filter:
                function (creep) { if (creep.memory.body==='BODY_DEFAULT'&&creep.memory.body === bodyType
                            && (creep.memory.phase === 'PHASE_SEARCH'
                                    || creep.memory.phase === undefined)) creep.say("im found");
                    return creep.memory.body === bodyType
                            && (creep.memory.phase === 'PHASE_SEARCH'
                                    || creep.memory.phase === undefined)
                }
    });
};

RoomPosition.prototype.findClosestCreepEmpty = function (_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, {filter:
                function (creep) {
                    return creep.memory.body === bodyType
                            && (creep.memory.phase === 'PHASE_SEARCH'
                                    || creep.memory.phase === undefined)
                            && creep.carry.energy < 50; //<= creep.carryCapacity * 0.5;
                }
    });
};

RoomPosition.prototype.findClosestCreepFull = function (_bodyType) {
    var bodyType = _bodyType;
    return this.findClosestByPath(FIND_MY_CREEPS, {filter:
                function (creep) {
                    return creep.memory.body === bodyType
                            && (creep.memory.phase === 'PHASE_SEARCH'
                                    || creep.memory.phase === undefined)
                            && creep.carry.energy >= 25; //> creep.carryCapacity * 0.25;
                }
    });
};

RoomPosition.prototype.asString = function () {
    return this.x + '/' + this.y + ' (' + this.roomName + ')';
};
