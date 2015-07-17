





    Memory.logger = {};
    Memory.logger.level = 0;
    Memory.logger.indentation = ["", "  ", "    ", "      ", "        ", "          ", "            ", "              ", "                ", "                "];
    function logCompact(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + text
        );
    }
    function logDetail(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + text
        );
    }
    function logError(text) {
        console.log(
            Memory.logger.indentation[Memory.logger.level] + '!!!ERROR!!!' + text
        );
    }
    function logLevelIncrease() {
        Memory.logger.level ++;
    }
    function logLevelDecrease() {
        Memory.logger.level --;
    }
    Memory.timer = {};

    function timerBegin(module, timerName) { timerBegin_(module, timerName, ""); }
    function timerEnd(module, timerName) { timerEnd_(module, timerName, ""); }
    function timerBegin_(module, timerName, text) {
        logDetail('--> ' + timerName + ' ' + text);
        logLevelIncrease();
        Memory.timer[timerName] = Game.getUsedCpu();
    }
    function timerEnd_(module, timerName, text) {
        Memory.timer[timerName] = Game.getUsedCpu() - Memory.timer[timerName];
        logLevelDecrease();
        logDetail('<-- ' + timerName + ' [' + Memory.timer[timerName].toFixed(1) + '] ' + text
        );
    }


    console.log('===============================================' + Game.time +
                 '===============================================');


timerBegin("main", 'main');



var CTask = function CTask(type, targetId, pos, qty, energySource) {
    this.type = type;
    this.targetId = targetId;
    this.pos = pos;
    this.qty = qty;
    this.qtyAssigned = 0;
    this.energySource = energySource;




    this.assignments = {};

    switch (this.type) {
        case 'TASK_HARVEST': this.bodyTypes = ['worker', 'default']; break;
        case 'TASK_COLLECT': this.bodyTypes = ['default']; break;
        case 'TASK_DELIVER': this.bodyTypes = ['default']; break;
        case 'TASK_UPGRADE': this.bodyTypes = ['upgrader', 'default']; break;
        case 'TASK_BUILD': this.bodyTypes = ['default']; break;
        case 'TASK_REPAIR': this.bodyTypes = ['default']; break;
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
};


CTask.prototype.getType = function() {
    return this.type;
};
CTask.prototype.getTarget = function() {
    return Game.getObjectById(this.targetId);
};
CTask.prototype.getPos = function() {
    if (this.pos.construtor !== RoomPosition) {
        this.pos.__proto__ = RoomPosition.prototype;
    }
    return this.pos;
};



CTask.prototype.getRoom = function() {
    return Game.rooms[this.pos.roomName];
};
CTask.prototype.getQty = function() {
    return this.qty;
};




CTask.prototype.getQtyAssigned = function() {
    if (this.qtyAssigned === undefined) {
        var qtyAssigned = 0;
        _.forEach(this.getAssignments(), function(assignment) {
            qtyAssigned += assignment;
        });
        this.qtyAssigned = qtyAssigned;
    }
    return this.qtyAssigned;
};
CTask.prototype.getAssignments = function() {
    return this.assignments;
};
CTask.prototype.getAssignmentsCnt = function() {
    return Object.keys(this.assignments).length;
};
CTask.prototype.getBodyTypes = function() {
    return this.bodyTypes;
};




CTask.prototype.getCode = function() {
    if (this.code === undefined) {
        this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
    }
    return this.code;
};







CTask.prototype.assignmentSearch = function() {
    var creep = null;
    var task = this;
    _.forEach(this.getBodyTypes(), function(bodyType) {
        if (!creep) {
            if (task.energySource) creep = task.getPos().findClosestCreepEmpty(bodyType);
            else creep = task.getPos().findClosestCreepFull(bodyType);
        }
    });
    return creep;
};






CTask.prototype.assignmentCreate = function(creep) {
    var qty = 0;
    switch (this.type) {
        case 'TASK_HARVEST':
            if (creep.getBodyType() == 'worker') qty = this.qty;
            else qty = 1;
            break;
        case 'TASK_COLLECT': qty = creep.energyCapacity - creep.energy; break;
        case 'TASK_DELIVER': qty = creep.energy; break;
        case 'TASK_UPGRADE': qty = qty = 1; break;
        case 'TASK_BUILD':
        case 'TASK_REPAIR':
            if (creep.getBodyType() == 'worker') qty = this.qty;
            else qty = 1;
            break;
        default:
            this.logError("Can't assign task, type " + type + " not available.");
            return;
    }
    creep.taskAssign(this);
    if (qty > this.qty) qty = this.qty;
    this.assignments[creep.name] = qty;
    delete this.qtyAssigned;
};





CTask.prototype.assignmentDelete = function(creepName) {
    delete this.assignments[creepName];
    delete this.qtyAssigned;
};






CTask.prototype.equals = function(task) {
    if (this.type === task.type
        && this.targetId === task.targetId
        && this.pos === task.pos
        && this.qty === task.qty
        && this.energySource === task.energySource
        && this.energySink === task.energySink
    ) {
        return true;
    } else {
        return false;
    }
};





CTask.prototype.update = function(task) {
    this.type = task.type;
    this.targetId = task.targetId;
    this.pos = task.pos;
    this.qty = task.qty;
    this.energySource = task.energySource;
    this.energySink = task.energySink;
};






var CTasks = function CTasks()
{
    this.collection = {};
}



CTasks.prototype.getCollection = function() {
    return this.collection;
}
CTasks.prototype.get = function(taskCode) {
    var task = this.collection[taskCode];
    if (task && task.constructor != CTask)
        task.__proto__ = CTask.prototype;
    return task;
}
CTasks.prototype.add = function(task) {
    var myTask = this.get(task.getCode());
    if (myTask == undefined) this.collection[task.getCode()] = task;
    else if (!myTask.equals(task)) myTask.update(task);
}




CTasks.prototype.del = function(task) {
    var taskCode;
    if (task instanceof String) taskCode = task;
    else taskCode = task.getCode();
    if (this.getTask(taskCode)) delete this.collection[taskCode];
    else this.logError("Task does not exist.");
}

CTasks.prototype.getCount = function() {
    return this.count = Object.keys(this.collection).length;;
}



Spawn.prototype.spawn = function(body, bodyParts) {
    var result = this.createCreep(bodyParts);
    if(_.isString(result)) {
        this.room.logCompact('Spawning: ' + result + " with Body: " + bodyParts + " / new sum: " + (this.room.creeps.length + 1));
        if (body == 'default') Memory.creeps[result].role = 'harvester';
        if (body == 'ranger') Memory.creeps[result].role = 'guard';
        Memory.creeps[result].body = body;
    } else {
        if (result != ERR_BUSY)
            this.room.logCompact('Spawn error: ' + result + ' while try to spawn ' + JSON.stringify(bodyParts));
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
    this.spawn('default', bodyParts);
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
    this.spawn('worker', bodyParts);
}

Spawn.prototype.spawnUpgrader = function() {
    var bodyParts = [ WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, MOVE ];
    this.spawn('upgrader', bodyParts);
}

Spawn.prototype.spawnHealer = function() {
    var bodyParts;
    if (this.room.extensions.length >= 20) {
        bodyParts = [ MOVE, MOVE, MOVE,
            HEAL, HEAL, HEAL, HEAL,
            MOVE
        ];
    } else {
        bodyParts = [MOVE, HEAL];
    }
    this.spawn('healer', bodyParts);
}

Spawn.prototype.spawnRanger = function() {
    var bodyParts;
    if (this.room.extensions.length >= 40) {
        bodyParts = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            TOUGH, TOUGH, TOUGH, TOUGH,

            MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE, MOVE, MOVE, MOVE,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            MOVE
        ];
    } else if (this.room.extensions.length >= 30) {
        bodyParts = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            TOUGH, TOUGH, TOUGH,
            MOVE, MOVE, MOVE, MOVE, MOVE,
            MOVE, MOVE, MOVE, MOVE,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            MOVE
        ];
    } else if (this.room.extensions.length >= 20) {
        bodyParts = [
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
            MOVE, MOVE, MOVE, MOVE, MOVE,
            RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
            MOVE
        ];
    } else {
        this.logError("can't create ranger");
    }
    this.spawn('ranger', bodyParts);
}
Structure.prototype.isFull = function() {
    return this.energy >= this.energyCapacity;
}

Structure.prototype.isEmpty = function() {
    return this.energy <= 0;
}


Source.prototype.memory = undefined;

Source.prototype.setMemory = function() {
    this.memory = this.room.memory.sources[this.id];
}

Source.prototype.initSpots = function() {
    timerBegin_("room", 'initSpots', 'of room ' + this.room.name);
    this.memory.spots = [];


    var targetsStructures = this.pos.findEnemyStructuresInAttackRange();

    this.memory.hasHostileSpawn = targetsStructures.length > 0;





    for (var y = this.pos.y - 1; this.pos.y + 1 >= y; ++ y) {
        for (var x = this.pos.x - 1; this.pos.x + 1 >= x; ++ x) {
            var pos = this.room.lookAt(x, y);
            var isFree = true;


            for (var nr in pos)
                if (pos[nr].type == 'terrain' && pos[nr].terrain == 'wall')
                    isFree = false;

            if (isFree) {
                this.memory.spots.push(
                    {sourceId: this.id, x:x, y:y}
                );
            }
        }
    }
    timerEnd("room", 'initSpots');
}


Source.prototype.logDetail = function(message) {
    logDetail("[SOURCE] " + message);
}

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
    if ( spawn ) rangeS = this.getRangeTo(spawn);
    else rangeS = 99999999;
    if ( extension ) rangeE = this.getRangeTo(extension);
    else rangeE = 99999999;
    if (!extension && !spawn) return this.findClosest(FIND_MY_SPAWNS);
    else if (extension && rangeE <= rangeS ) return extension;
    else if (spawn && rangeS <= rangeE ) return spawn;
    else console.log("error while findng a energy source");
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
                return creep.memory.body == 'default' && (creep.memory.phase == undefined || creep.memory.phase == 'search');
            }
        }
    );
}
RoomPosition.prototype.findClosestSearchingHarvester = function() {
    return this.findClosest(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.body == 'worker' && (creep.memory.phase == undefined || creep.memory.phase == 'search');
            }
        }
    );
}
RoomPosition.prototype.findClosestSearchingUpgrader = function() {
    return this.findClosest(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.body == 'upgrader' && (creep.memory.phase == undefined || creep.memory.phase == 'search');
            }
        }
    );
}






RoomPosition.prototype.findClosestCreepEmpty = function(_bodyType) {
    var bodyType = _bodyType;
    return this.findClosest(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body === bodyType
                    && creep.memory.phase == 'search'
                    && creep.energy <= creep.energyCapacity / 2
        }
    });
};

RoomPosition.prototype.findClosestCreepFull = function(_bodyType) {
    var bodyType = _bodyType;
    return this.findClosest(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body == bodyType
                    && creep.memory.phase == 'search'
                    && creep.energy > creep.energyCapacity / 2
        }
    });
};


Creep.prototype.runDefault = function() {
    if (
        this.memory.phase === undefined
        || this.memory.phase === 'search'
        || !this.getTask()
    ) {
        this.memory.phase = 'search';
    }

    if (this.memory.phase === 'search') {
        this.moveAround();
    }
    if (this.memory.phase === 'task') {
        this.say("do my task");
        switch (this.getTask().getType()) {
            case 'TASK_HARVEST': this.taskHarvest(); break;
            case 'TASK_COLLECT': break;
            case 'TASK_DELIVER': break;
            case 'TASK_UPGRADE': break;
            case 'TASK_BUILD': break;
            case 'TASK_REPAIR': break;
            default:
                this.logError("task " + this.getTask().getType() + " not available");
                return;
        }
    }
};

Creep.prototype.getTask = function() {
    if (!this.task && this.memory.taskCode) {
        this.task = this.room.getTasks().get(this.memory.taskCode);
        if (!this.task) this.logError("task " + this.memory.taskCode + " not available")
    }
    return this.task;
}

Creep.prototype.taskAssign = function(task) {
    this.memory.taskCode = task.getCode();
    this.memory.phase = 'task';
}

Creep.prototype.taskDisassign = function() {
    this.memory.phase = 'search';
    delete this.memory.taskCode;
    delete this.task;
}

Creep.prototype.taskHarvest = function() {
    var source = this.getTask().getTarget();
    if ( source != null ) {

        this.movePredefined(source.pos);
        this.harvest(source);
    } else {
        this.memory.phase = 'search';
    }
}



Creep.prototype.changeCollector = function() {
    this.memory.role = 'collector';
    this.memory.phase = 'collect';
    this.logDetail("add a collector");
}


Creep.prototype.runBuilder = function() {
    if(this.energy == 0) {
        if(this.room.defaultSpawn.energy >= 150) {
            this.movePredefined(this.room.defaultSpawn.pos, {ignoreCreeps: true});
            this.room.defaultSpawn.transferEnergy(this);
        } else {
            this.memory.phase = 'search';
            this.moveAround();
        }
    } else {
        var target = this.pos.findClosest(FIND_CONSTRUCTION_SITES);
        if (target) {
            this.movePredefined(target.pos);
            var result = this.build(target);
            if (result == ERR_RCL_NOT_ENOUGH) this.memory.role = "upgrader";
            else if (result != OK && result != ERR_NOT_IN_RANGE) {
                this.movePredefined(this.room.defaultSpawn.pos);
                if (result != ERR_INVALID_TARGET) this.logError(this.name + " can't build " + result);
            }
        } else {
            this.memory.phase = 'search';
        }
    }
}


Creep.prototype.runCollector = function() {

    if(this.energy >= this.energyCapacity * 0.8) {
        this.memory.role = 'harvester';
        this.memory.phase = 'deliver';
        return;

    } else {
        var target = null;
        if (this.memory.currentTargetId) {
            target = Game.getObjectById(this.memory.currentTargetId);
            if (target && target.constructor != Energy) target = null;
        }
        if (!target) {
            var i = Math.floor(Math.random() * this.room.energy.length);
            target = this.room.energy[i];
            if (target) this.memory.currentTargetId = target.id;
        }

        if (target) {
            this.movePredefined(target.pos);
            this.pickup(target);
        } else {
            this.memory.phase = 'search';
            this.moveAround();
        }
    }
}


Creep.prototype.runDefaultHarvester = function() {
    var empty = this.energy <= 0;
    var full = this.energy >= this.energyCapacity;
    var phase = this.memory.phase;

    if (phase == 'search' && empty) this.memory.phase = 'search';
    else if (phase == 'search' && !empty) this.memory.phase = 'deliver';
    else if (phase == 'harvest' && !full) this.memory.phase = 'harvest';
    else if (phase == 'harvest' && full) this.memory.phase = 'deliver';
    else if (phase == 'deliver' && !empty) this.memory.phase = 'deliver';
    else if (phase == 'deliver' && empty) this.memory.phase = 'search';
    else {
        this.memory.phase = 'search';
    }

    if (this.memory.phase == 'search') {
        delete this.memory.harvesterSourceId;
        this.moveAround();
    }
    if (this.memory.phase == 'harvest') {
        var source = this.room.sources[this.memory.harvesterSourceId];
        if ( source != null ) {

            this.movePredefined(source.pos);
            this.harvest(source);
        } else {
            this.memory.phase = 'search';
        }
    } else if (this.memory.phase == 'deliver') {
        var ext = this.pos.findClosestEmptyExtension();
        if (ext != null) {
            this.movePredefined(ext.pos);
            this.transferEnergy(ext)
        } else {
            if (this.room.defaultSpawn.energy < this.room.defaultSpawn.energyCapacity) {
                this.movePredefined(this.room.defaultSpawn.pos);
                this.transferEnergy(this.room.defaultSpawn);
            } else {
                this.moveAround();
                this.memory.phase = 'search';
            }
        }
    }
}


Creep.prototype.runPionier = function() {
    if (this.room.defaultSpawn) {
        this.memory.phase = 'search';
    }

    var empty = this.energy <= 0;
    var full = this.energy >= this.energyCapacity;
    var phase = this.memory.phase;
    if (phase == 'search') ;
    else if (phase == 'harvest' && !full) ;
    else if (phase == 'harvest' && full) this.memory.phase = 'deliver';
    else if (phase == 'deliver' && !empty) ;
    else if (phase == 'deliver' && empty) this.memory.phase = 'search';
    else {
        this.memory.phase = 'search';
        console.log("No harvester phase for " + this.name + " - phase:" + phase + " empty:" + empty + " full:" + full)
    }

    if (this.memory.phase == 'search') {
        this.memory.phase = 'harvest';
    }
    if (this.memory.phase == 'harvest') {
        sources = this.room.find(FIND_SOURCES);
        for (var sourceId in sources) {
            var source = sources[sourceId];
            if ( source != null ) {
                var targets = source.pos.findEnemiesInAttackRange();
                var targetsStructures = source.pos.findEnemyStructuresInAttackRange();
                if(targets.length == 0 && targetsStructures == 0) {
                    this.moveTo(source);
                    this.harvest(source);
                    break;
                }
            }
        }
    } else if (this.memory.phase == 'deliver') {
        var target = this.pos.findClosest(FIND_CONSTRUCTION_SITES);
        this.moveTo(target);
        var result = this.build(target);
        if (result == ERR_RCL_NOT_ENOUGH) this.memory.role = "upgrader";
        else if (result != OK && result != ERR_NOT_IN_RANGE) {
            if (result != ERR_INVALID_TARGET) console.log(this.name + " can't build " + result);
        }
        this.moveTo(Game.spawns.Spawn2);
    }
}


Creep.prototype.runRepairer = function() {
    if(this.energy == 0) {
        this.movePredefined(this.room.defaultSpawn);
        if (this.room.defaultSpawn.energy >= 50) this.room.defaultSpawn.transferEnergy(this);
        else {
            this.memory.phase = 'search';
            this.moveAround();
        }
    } else {
        var structure = null;
        if (this.memory.currentTargetId) {
            structure = Game.getObjectById(this.memory.currentTargetId);
            if (!structure || structure.constructor != Structure || structure.hits >= structure.hitsMax) {
                structure = null;
                delete this.memory.currentTargetId;
            }
        }
        if (!structure) {
            structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                function(object) {
                    return object.structureType == STRUCTURE_RAMPART && object.hits < 1000;
                }
            });
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 10000;
                    }
                });
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 25000;
                    }
                });
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 100000;
                    }
                });
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_STRUCTURES, {filter:
                    function(object) {
                        return (object.structureType == STRUCTURE_ROAD && object.hits < object.hitsMax * 0.98)
                    }
                });
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 250000;
                    }
                });
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 1000000;
                    }
                });
                this.memory.phase = 'search';
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < 10000000;
                    }
                });
            }
            if (!structure) {
                var structure = this.pos.findClosest(FIND_MY_STRUCTURES, {filter:
                    function(object) {
                        return object.structureType == STRUCTURE_RAMPART && object.hits < object.hitsMax * 0.98;
                    }
                });
            }
        }
        if (structure != null) {
            this.memory.currentTargetId = structure.id;
            this.movePredefined(structure.pos);
            var result = this.repair(structure);
            if (result != OK && result != ERR_NOT_IN_RANGE) console.log(this.name + " can't repair " + result);
        } else {
            this.memory.phase = 'search';
            this.moveAround();
        }
    }
}


Creep.prototype.runDefaultUpgrader = function() {
    if(this.energy <= 0) {
        var energyContainer = this.room.defaultSpawn;

        if (energyContainer && energyContainer.energy >= 150) {
           this.movePredefined(energyContainer.pos);
           energyContainer.transferEnergy(this);
        } else {
            this.memory.phase = 'search';
        }
    } else {
        this.movePredefined(this.room.controller.pos);
        this.upgradeController(this.room.controller);
    }
}



Creep.prototype.runHarvester = function() {
    if (this.memory.phase == 'search') {
        delete this.memory.harvesterSourceId;
        this.logDetail("worker has no idea what to do");
        this.moveAround();
    }
    if (this.memory.phase == 'harvest') {
        var source = this.room.sources[this.memory.harvesterSourceId];
        if ( source != null ) {
            if (this.energy < this.energyCapacity || !source.memory.linkId) {
                this.movePredefined(source.pos);
            } else {
                var link = Game.getObjectById(source.memory.linkId)
                this.movePredefined(link.pos);
                this.transferEnergy(link);
            }
            this.harvest(source);
        } else {
            this.memory.phase = 'search';
        }
    }
}


Creep.prototype.runUpgrader = function() {
    if (this.memory.phase == 'search') {
        delete this.memory.harvesterSourceId;
        this.logDetail("upgrader has no idea what to do");
        this.moveAround();
    }
    if (this.memory.phase == 'upgrade') {
        if (this.energy > this.energyCapacity / 2) {
            this.movePredefined(this.room.controller.pos);
        } else {
            var link = this.room.controllerLink;
            if (link) {
                this.movePredefined(link.pos);
                restult = link.transferEnergy(this);
            } else {
                this.logError("no controllerLink available");
            }
        }
        this.upgradeController(this.room.controller);
    }
}



Creep.prototype.runRanger = function() {
    var target = this.pos.findClosest(this.room.getHostileCreeps());

    if (!target && this.room.getHostileCreeps().length ) {
        var creeps = this.room.find(FIND_HOSTILE_CREEPS);
        if (creeps[0]) {
            console.log("found an invalid target" + JSON.stringify(creeps));
            target = creeps[0];
        }
    }
    if(target) {

        if (!this.pos.inRangeTo(target, 3))
            this.movePredefined(target);
        if (this.pos.inRangeTo(target, 2) || this.hits < this.hitsMax * 0.3)
            this.movePredefined(this.room.defaultSpawn);
        this.rangedAttack(target);
        this.memory.currentTargetId = target.id;
    } else {
        if (this.room.name == 'W12S3' && Game.rooms.W12S2.creepsRanger.length <= 4) {
            this.movePredefined(Game.flags.W12S2.pos);
            return;
        }
        if (Number.isInteger(this.memory.hostileSpawnNr)) {
            var selectedSpawn = this.room.hostileSpawns[this.memory.hostileSpawnNr];
            var collectionPoint = Game.flags[this.room.name + "Source" + this.memory.hostileSpawnNr];
            if (collectionPoint && collectionPoint.pos) {
                this.movePredefined(collectionPoint.pos, {}, true);
            } else {
                this.logError(this.room.name + "Source" + this.memory.hostileSpawnNr + " not found");
            }
        } else {
            var spawns = this.room.find(FIND_HOSTILE_STRUCTURES);
            var selectedSpawn = false;
            var selectedSpawnTicks = 99999;
            for (spawnNr in spawns) {
                var spawn = spawns[spawnNr];
                if (spawn.ticksToSpawn < 30 && spawn.ticksToSpawn < selectedSpawnTicks) {
                    selectedSpawn = spawn;
                    selectedSpawnTicks = spawn.ticksToSpawn;
                }
            }
            if (selectedSpawn) {
                if (!this.pos.inRangeTo(selectedSpawn, 6))
                    this.moveTo(selectedSpawn);

            } else {
                var collectionPoint = Game.flags[this.room.name];
                if (collectionPoint) {
                    this.movePredefined(collectionPoint.pos, {}, true);
                }
            }
        }







        delete this.memory.currentTargetId;
    }




}


Creep.prototype.runHealer = function() {
    var damagedCreep = this.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(object) {
            return object !== this && object.hits < object.hitsMax;
        }
    });
    if (this.hits < this.hitsMax - 50 ) {
        this.movePredefined(this.room.defaultSpawn);
        this.heal(damagedCreep);
        this.rangedHeal(damagedCreep);
        return;
    }

    if(damagedCreep) {
        var hisTarget = Game.getObjectById(damagedCreep.memory.currentTargetId);
        if (hisTarget && this.pos.inRangeTo(hisTarget, 3))
            this.movePredefined(this.room.defaultSpawn);
        else
            if (!this.pos.inRangeTo(damagedCreep, 1))
                this.movePredefined(damagedCreep);
        this.rangedHeal(damagedCreep);
        this.heal(damagedCreep);
        return;
    }
    if (this.room.name == 'W12S3' && Game.rooms.W12S2.creepsHealer.length < 2) {
        this.movePredefined(Game.flags.W12S2.pos);
        return;
    }

    var guard = this.pos.findClosest(FIND_MY_CREEPS, {
        filter: function(creep) {
            return creep.memory.role === 'guard';
        }
    });
    if (guard) {
        if (!this.pos.inRangeTo(guard, 1))
           this.movePredefined(guard);
    } else {
        var collectionPoint = Game.flags[this.room.name];
        if (collectionPoint) {
          this.movePredefined(collectionPoint.pos, {}, true);
        } else {
            this.movePredefined(this.room.defaultSpawn);
        }
    }
}



Creep.prototype.run = function() {
    var body = this.memory.body;
    var role = this.memory.role;
    if (role === 'harvester') this.runDefaultHarvester();
    else if (role === 'builder') this.runBuilder();
    else if (role === 'collector') this.runCollector();
    else if (role === 'pionier') this.runPionier();
    else if (role === 'repairer') this.runRepairer();
    else if (role === 'upgrader') this.runDefaultUpgrader();

    else if (role === 'test') this.runDefault();

    else if (body === 'worker') this.runHarvester();
    else if (body === 'upgrader') this.runUpgrader();
    else if (body === 'healer') this.runHealer();
    else if (body === 'ranger') this.runRanger();
    else this.logError("has no role");
}



Creep.prototype.movePredefined = function(targetPos, opts, onPos) {
    if (!this.pos.inRangeTo(targetPos, 1) || onPos) {
        if (!opts) opts = {};
        opts.reusePath = 0;
        this.moveTo(targetPos, opts);
    }
}

Creep.prototype.getBodyType = function() {
    return this.body;
}

Creep.prototype.moveAround = function() {
    this.move(Game.time % 8 + 1);
}

Creep.prototype.moveRandom = function() {
    this.move(Math.floor(Math.random() * 8) % 8 + 1);
}


Creep.prototype.logCompact = function(message) {
    logCompact('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logDetail = function(message) {
    logDetail('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logError = function(message) {
    logError('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Room.prototype.findDroppedEnergy = function() {
    return this.find(FIND_DROPPED_ENERGY,
        { filter:
            function (energy) {
                return energy.energy >= 50;
            }
        }
    );
};

Room.prototype.findSearchingDefaultWorker = function() {
    return this.find(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body == 'default' && creep.memory.phase == 'search'
        }
    });
};

Room.prototype.findSearchingDefaultWorkerEmpty = function() {
    return this.find(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body == 'default' && creep.memory.phase == 'search' && creep.energy <= creep.energyCapacity / 2
        }
    });
};

Room.prototype.findSearchingDefaultWorkerFull = function() {
    return this.find(FIND_MY_CREEPS, { filter:
        function (creep) {
            return creep.memory.body == 'default' && creep.memory.phase == 'search' && creep.energy > creep.energyCapacity / 2
        }
    });
};

Room.prototype.getTasks = function() {
    if (this.memory.tasks == undefined) {
        this.memory.tasks = new CTasks();
    }
    if (this.memory.tasks != CTask)
        this.memory.tasks.__proto__ = CTasks.prototype;
    return this.memory.tasks;
}

Room.prototype.initTasks = function() {
    timerBegin_("room", 'initTasks', 'of room ' + this.name);
    for (var id in this.sources) {
        var source = this.sources[id];

        if (source.memory.isSave) {
            this.createTask(
                    'TASK_HARVEST',
                    source.id,
                    source.pos,
1
            );
        }
    }
this.assignTasks();
    timerEnd("room", 'initTasks');
}

Room.prototype.createTask = function(type, targetId, pos, qty) {
    timerBegin_("room", 'createTask', 'of room ' + this.name);
    var energySource = false;
    switch (type) {
        case 'TASK_HARVEST':
            energySource = true;
            break;
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
    var task = new CTask(type, targetId, pos, qty, energySource);
    this.getTasks().add(task);

    timerEnd("room", 'createTask');
}

Room.prototype.assignTasks = function() {
    timerBegin_("room", 'assignTasks', 'of room ' + this.name);
    var tasks = this.getTasks().getCollection();
    for (var taskCode in tasks) {
        var task = tasks[taskCode];
logDetail(JSON.stringify("task " + task.getCode()));;
        var assignments = task.getAssignments();
        for (var creepName in assignments) {
            var creep = Game.creeps[creepName];
            if ( !creep ) {
                task.assignmentDelete(creepName);
logDetail(JSON.stringify("disassign task " + task.getCode()));;
            } else if (creep.memory.taskCode !== task.getCode()
                || creep.memory.phase !== 'task'
            ) {
                task.assignmentDelete(creepName);
                creep.taskDisassign();
logDetail(JSON.stringify("AAAdisassign task " + task.getCode()));;
            } else {

            }
        }
logDetail(JSON.stringify(task.assignments));
        while (task.getQtyAssigned() < task.getQty()) {
            creep = task.assignmentSearch();
            if (creep) {
logDetail(JSON.stringify("assign task " + task.getCode() + " to " + creep.name));;
                task.assignmentCreate(creep);
break;
            } else {
                break;
            }
        }
logDetail(JSON.stringify(task.assignments));
    }

    timerEnd("room", 'assignTasks');
}



Room.prototype.run = function() {
    this.initCreeps();
    if (!this.memory.timer || this.memory.timer <= 0) {
        timerBegin_("room", 'static_init', 'of room ' + this.name);
            this.memory.timer = -1;
            this.initSources();
            this.memory.timer = 600;
        timerEnd("room", 'static_init');
    }

    timerBegin_("room", 'load', 'of room ' + this.name);
        this.loadSources();
        this.loadStructures();
        this.loadConstructions();
    timerEnd("room", 'load');


    if (this.memory.timer % 30 == 0) {
        timerBegin_("room", 'dynamic_init', 'of room ' + this.name);
            this.initDynamicSources();
            this.initDynamicConstructions();
            this.initDynamicStructures();
        timerEnd("room", 'dynamic_init');
    }

    this.initTasks();

    timerBegin_("room", 'actions', 'of room ' + this.name);
        this.structuresAction();

        this.sourcesWorkerAction();
        this.collectorWorkerAction();
        this.constructionsWorkerAction();
        this.upgraderWorkerAction();
        this.repairerWorkerAction();

        this.guardAction();

        this.spawnAction();
    timerEnd("room", 'actions');

    -- this.memory.timer;
}


Room.prototype.initSources = function() {
    timerBegin_("room", 'initSources', 'of room ' + this.name);
    if (!this.memory.sources)
        this.memory.sources = {};

    for (var source of this.find(FIND_SOURCES)) {
        if (!this.memory.sources[source.id]) {
            this.memory.sources[source.id] = {};
            this.memory.sources[source.id].id = source.id;
        }
        source.setMemory();
        source.initSpots();
    }

    this.memory.hostileSpawnIds = [];
    this.memory.hostileSpawns = this.find(FIND_HOSTILE_STRUCTURES);
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        this.memory.hostileSpawnIds[hostileSpawnNr] = this.memory.hostileSpawns[hostileSpawnNr].id;
    }
    timerEnd("room", 'initSources');
}
Room.prototype.loadSources = function() {
    this.sources = {};
    for (var id in this.memory.sources) {
        this.sources[id] = Game.getObjectById(id);
        this.sources[id].setMemory();
    }

    this.hostileSpawns = [];
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        var hostileSpawnId = this.memory.hostileSpawns[hostileSpawnNr].id;
        this.hostileSpawns[hostileSpawnNr] = Game.getObjectById(hostileSpawnId);
    }
}
Room.prototype.initDynamicSources = function() {
    this.memory.sourcesSaveCount = 0;
    this.memory.sourceSpotCount = 0;
    for (var id in this.sources) {
        var source = this.sources[id];

        source.memory.isSave = (
                this.creepsHealer.length >= 4 * this.hostileSpawns.length
                && this.creepsRanger.length >= 3 * this.hostileSpawns.length
            ) || !source.memory.hasHostileSpawn;
        if (source.memory.isSave) {
            this.memory.sourcesSaveCount ++;
            this.memory.sourceSpotCount += source.memory.spots.length;
        }

        var link = source.pos.findInRangeLink(2);
        if (link[0] != undefined) source.memory.linkId = link[0].id;
    }
}
Room.prototype.sourcesWorkerAction = function() {
    timerBegin_("room", 'sourcesWorkerAction', 'of room ' + this.name);
    for (var id in this.sources) {
        var source = this.sources[id];

        if (source.memory.isSave) {
            var creep = Game.creeps[source.memory.creepName];
            if ( !creep
                || creep.memory.harvesterSourceId != source.id
                || creep.memory.phase != 'harvest'
            ) {
                if (!creep) {
                    delete source.memory.creepName;
                }
                creep = source.pos.findClosestSearchingHarvester();
                if (creep) {
                    creep.memory.harvesterSourceId = source.id;
                    creep.memory.phase = 'harvest';
                    source.memory.creepName = creep.name;
                } else {
                    for (var i in source.memory.spots) {
                        var sourceSpot = source.memory.spots[i];
                        creep = Game.creeps[sourceSpot.creepName];

                        if ( !creep
                            || creep.memory.harvesterSourceId != source.id
                            || creep.memory.phase != 'harvest'
                        ) {
                            if (creep) {
                                delete sourceSpot.creepName;
                            }
                            creep = source.pos.findClosestSearchingDefaultWorker();
                            if (creep) {
                                creep.memory.role = 'harvester';
                                creep.memory.harvesterSourceId = source.id;
                                creep.memory.phase = 'harvest';
                                sourceSpot.creepName = creep.name;
                                this.logError("add a new default harvester for sourceSpot " + source.pos.x + " " + source.pos.y);
                            }
                        }
                    }
                }
            }
        }
    }
    timerEnd("room", 'sourcesWorkerAction');
}


Room.prototype.collectorWorkerAction = function() {
    this.energy = this.findDroppedEnergy();

    this.energyAmount = this.creepsHarvester.length;
    for (var i in this.energy) {
        var energy = this.energy[i];
        this.energyAmount += energy.energy;
    }


    var collectorCount = Math.round(this.energyAmount / 100) + 1;
    if (collectorCount > this.creepsDefault.length / 2)
        collectorCount = this.creepsDefault.length / 2;

    var creeps = this.find(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.role == 'collector'
            }
        }
    );
    var oldCollectorCount = creeps.length;

    if (oldCollectorCount < collectorCount) {
        creeps = this.findSearchingDefaultWorkerEmpty();
        for(var i = 0; i < collectorCount - oldCollectorCount; ++ i) {
            if (creeps[i]) {
                creeps[i].changeCollector();
            } else {
                break;
            }
        }
    }
}


Room.prototype.upgraderWorkerAction = function() {

    var creep = this.controller.pos.findClosestSearchingUpgrader();
    if (creep) {
        creep.memory.phase = 'upgrade';
    }

    var upgraderCount = this.getDefaultUpgraderCount() - this.creepsUpgrader.length;
    var creeps = this.find(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.role == 'upgrader'
            }
        }
    );
    var oldUpgraderCount = creeps.length;

    if (oldUpgraderCount < upgraderCount) {
        creeps = this.findSearchingDefaultWorkerFull();
        if (creeps.length == 0) creeps = this.findSearchingDefaultWorker();
        for(var i = 0; i < upgraderCount - oldUpgraderCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'upgrader';
                creeps[i].memory.phase = 'upgrade';
                this.logDetail("add a upgrader " + creeps[i].name);
            }
        }
    }
}


Room.prototype.initDynamicStructures = function() {
    this.memory.extensionIds = [];

    this.extensions = this.find(
        FIND_MY_STRUCTURES,
        {filter: {structureType: STRUCTURE_EXTENSION}}
    );
    for (var extensionNr in this.extensions)
        this.memory.extensionIds[extensionNr] = this.extensions[extensionNr].id;

    var link = this.controller.pos.findInRangeLink(2);
    if (link[0] != undefined) this.memory.controllerLinkId = link[0].id;
}
Room.prototype.loadStructures = function() {
    this.extensions = [];
    for (var extensionNr in this.memory.extensionIds) {
        var extensionId = this.memory.extensionIds[extensionNr];
        this.extensions[extensionNr] = Game.getObjectById(extensionId);
    }
    this.controllerLink = Game.getObjectById(this.memory.controllerLinkId);
}
Room.prototype.structuresAction = function() {
    for (var i in this.sources) {
        var linkId = this.sources[i].memory.linkId;
        if (linkId) {
            var link = Game.getObjectById(linkId);
            if (link.isFull() && this.controllerLink.isEmpty()) {
                link.transferEnergy(this.controllerLink);
                break;
            }
        }
    }
}


Room.prototype.initDynamicConstructions = function() {
    this.memory.constructionIds = [];

    this.constructions = this.find(FIND_CONSTRUCTION_SITES);
    for (var i in this.constructions)
        this.memory.constructionIds[i] = this.constructions[i].id;
}
Room.prototype.loadConstructions = function() {
    this.constructions = [];
    for (var i in this.memory.constructionIds) {
        this.constructions[i] = (Game.getObjectById(this.memory.constructionIds[i]));
    }
}
Room.prototype.constructionsWorkerAction = function() {
    var builderCount = 0.0;
    for (var i in this.constructions) {
        var construction = this.constructions[i];
        if (construction) {
            switch (construction.structureType) {
                case STRUCTURE_ROAD: builderCount += 0.2;
                    break;
                case STRUCTURE_EXTENSION: builderCount += 5;
                    break;
                default: ++ builderCount;
                    break;
            }
        }
    }

    var creeps = this.find(FIND_MY_CREEPS,
        { filter: function (creep) { return creep.memory.role == 'builder' } }
    );
    var oldBuildersCount = creeps.length;

    if (oldBuildersCount < builderCount) {
        creeps = this.findSearchingDefaultWorkerFull();
        if (creeps.length == 0) creeps = this.findSearchingDefaultWorker();
        for(var i = 0; i < builderCount - oldBuildersCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'builder';
                creeps[i].memory.phase = 'build';
                this.logDetail("add a builder " + creeps[i].name);
            }
        }
    }
}
Room.prototype.repairerWorkerAction = function() {
    var repairerCount = 3;

    var creeps = this.find(FIND_MY_CREEPS,
        { filter:
            function (creep) {
                return creep.memory.role == 'repairer'
            }
        }
    );
    var oldRepairersCount = creeps.length;

    if (oldRepairersCount < repairerCount) {
        creeps = this.findSearchingDefaultWorkerFull();
        if (creeps.length == 0) creeps = this.findSearchingDefaultWorker();
        for(var i = 0; i < repairerCount - oldRepairersCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'repairer';
                creeps[i].memory.phase = 'repair';
                this.logDetail("add a repairer " + creeps[i].name);
            }
        }
    }
}


Room.prototype.initCreeps = function() {
    this.creepsDefault = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'default'}}});
    this.creepsHarvester = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'worker'}}});
    this.creepsUpgrader = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'upgrader'}}});
    this.creepsRanger = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'ranger'}}});
    this.creepsHealer = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'healer'}}});

    this.creeps = this.creepsDefault.concat(this.creepsHarvester, this.creepsUpgrader, this.creepsRanger, this.creepsHealer);
}
Room.prototype.guardAction = function() {
    for (rangerNr in this.creepsRanger) {
        var creep = this.creepsRanger[rangerNr];

            creep.memory.hostileSpawnNr = rangerNr % this.hostileSpawns.length;
    }
}
Room.prototype.getDefaultHarvesterCount = function() {
    if (this.defaultHarvesterCount == undefined) {
        this.defaultHarvesterCount = 0;
        for (var id in this.sources) {
            var source = this.sources[id];
            if (source.memory.isSave)
                if (source.memory.creepName) ++ this.defaultHarvesterCount;
                else this.defaultHarvesterCount += source.memory.spots.length;
        }
    }
    return this.defaultHarvesterCount;
}
Room.prototype.getDefaultUpgraderCount = function() {
    return 1;
}
Room.prototype.creepsRequired = function() {
    return this.getDefaultHarvesterCount();
}
Room.prototype.creepsRequiredAllWork = function() {
    return this.getDefaultHarvesterCount() + this.getDefaultUpgraderCount() + 2 + 1;
}




Room.prototype.spawnAction = function() {
    for (var spawnId in this.spawns) {
        var spawn = this.spawns[spawnId];

        var bodyParts;
        var body;
        if ( this.creepsDefault.length > this.creepsRequired()
            && this.creepsHarvester.length < this.memory.sourcesSaveCount
            && this.extensions.length >= 5
        ) {
            spawn.spawnHarvester();
        } else if (this.creepsDefault.length < this.creepsRequiredAllWork()) {
            spawn.spawnDefault();
        } else if ( this.creepsHealer.length < this.hostileSpawns.length * 2
            && (this.creepsHealer.length < 2 || this.creepsRanger.length > this.hostileSpawns.length)
        ) {
            spawn.spawnHealer();
        } else if ( this.creepsRanger.length < this.hostileSpawns.length * 4
            && this.extensions.length >= 20
        ) {
            spawn.spawnRanger();
        } else if ( this.controllerLink
            && this.creepsUpgrader.length < this.controller.level - 4
            && this.extensions.length >= 23
        ) {
            spawn.spawnUpgrader();
        } else {
            this.logCompact('SPAWN: no creep is required');
        }
        break;
    }
}


Room.prototype.getHostileCreeps = function() {
    if (this.hostileCreeps == undefined) {
        this.hostileCreeps = this.find(FIND_HOSTILE_CREEPS);
    }
    return this.hostileCreeps;
}


Room.prototype.logCompact = function(message) {
    logCompact('[' + this.name + "] " + message);
}
Room.prototype.logDetail = function(message) {
    logDetail('[' + this.name + "] " + message);
}
Room.prototype.logError = function(message) {
    logError('[' + this.name + "] " + message);
}


timerBegin("main", 'game');
var managerGame = require('CManagerGame');
managerGame.run();
timerEnd("main", 'game');


timerBegin("main", 'room');
for (var roomName in Game.rooms) {
    var room = Game.rooms[roomName];

    room.spawns = room.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_SPAWN}});
    if (room.spawns.length > 0) {
        room.defaultSpawn = room.spawns[0];
    } else {
        room.defaultSpawn = Game.spawns.Spawn1;
    }

    room.run();
}
timerEnd("main", 'room');


timerBegin("main", 'creeps');
for(var creepName in Game.creeps) {
    var creep = Game.creeps[creepName];

    try {
        creep.run();
    } catch (e) {
        console.log("error");
    }

}
timerEnd("main", 'creeps');



timerEnd("main", 'main');
