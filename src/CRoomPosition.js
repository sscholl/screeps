// ######## Finds - RoomPosition ##############################################
RoomPosition.prototype.findEnemiesInAttackRange = function(opts) {
    return this.findInRange(FIND_HOSTILE_CREEPS, 4, opts);
};
RoomPosition.prototype.findEnemyStructuresInAttackRange = function(opts) {
    return this.findInRange(FIND_HOSTILE_STRUCTURES, 6, opts);
};

RoomPosition.prototype.findClosestEmptyExtension = function(opts) {
    return this.findClosest(FIND_MY_STRUCTURES, {
        filter: function(object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
    });
};
RoomPosition.prototype.findClosestEnergyContainer = function(opts) {
    var spawn = this.findClosest(FIND_MY_SPAWNS, {
        filter: function(object) { return object.energy > 0;}
    });
    var extension = this.findClosest(FIND_MY_STRUCTURES, {
        filter: function(object) { return object.structureType == STRUCTURE_EXTENSION && object.energy > 0;}
    });
    if ( spawn )        rangeS = this.getRangeTo(spawn);
    else                rangeS = 99999999;
    if ( extension )    rangeE = this.getRangeTo(extension);
    else                rangeE = 99999999;
    if (!extension && !spawn)                   return this.findClosest(FIND_MY_SPAWNS);
    else if (extension && rangeE <= rangeS )    return extension;
    else if (spawn && rangeS <= rangeE )        return spawn;
    else                                        console.log("error while findng a energy source");
};

RoomPosition.prototype.findInRangeLink = function(range) {
    return this.findInRange(FIND_MY_STRUCTURES, range, {
        filter: function(object) {return object.structureType == STRUCTURE_LINK}
    });
};

RoomPosition.prototype.findClosestSearchingDefaultWorker = function() {
    return this.findClosest(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.body == BODY_DEFAULT && (creep.memory.phase == undefined || creep.memory.phase == PHASE_SEARCH);
            }
        }
    );
}
RoomPosition.prototype.findClosestSearchingHarvester = function() {
    return this.findClosest(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.body == BODY_HARVESTER && (creep.memory.phase == undefined || creep.memory.phase == PHASE_SEARCH);
            }
        }
    );
}
RoomPosition.prototype.findClosestSearchingUpgrader = function() {
    return this.findClosest(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.body == BODY_UPGRADER && (creep.memory.phase == undefined || creep.memory.phase == PHASE_SEARCH);
            }
        }
    );
}