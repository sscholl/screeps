"use strict";

var Logger = require('Logger');
var Profiler = require('Profiler');

var CTask = require('CTask');

/**
 * add getter and setter for memory
 */
Object.defineProperty(Creep.prototype, "bodyType", {
    get: function bodyType() {
        if (this.memory.body === undefined) {
            var work = this.getBodyPartCnt(WORK);
            var move = this.getBodyPartCnt(MOVE);
            var carry = this.getBodyPartCnt(CARRY);
            var rattak = this.getBodyPartCnt(RANGED_ATTACK);
            var heal = this.getBodyPartCnt(HEAL);
            if (work > 0) {
                if (work === carry) this.memory.body = 'BODY_DEFAULT';else if (work <= 5) this.memory.body = 'BODY_HARVESTER';else this.memory.body = 'BODY_UPGRADER';
            } else if (carry > 0) {
                if (carry === 1 && move === 1) this.memory.body = 'BODY_CARRIER_TINY';else this.memory.body = 'BODY_CARRIER';
            } else if (rattak > 0) {
                this.memory.body = 'BODY_RANGER';
            } else if (heal > 0) {
                this.memory.body = 'BODY_HEALER';
            } else {
                this.logError('can not assign body by body parts.');
            }
        }
        return this.memory.body;
    },
    set: function bodyType(v) {
        this.memory.body = v;
    }
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "taskCodes", {
    get: function taskCodes() {
        if (this.memory.taskCodes === undefined) this.memory.taskCodes = [];
        return this.memory.taskCodes;
    },
    set: function taskCodes(v) {
        this.memory.taskCodes = v;
    }
});

// ########### GENERAL SECTION #########################################

Creep.prototype.run = function () {
    if (this.bodyType === 'BODY_DEFAULT') this.runDefault();else if (this.bodyType === 'BODY_HARVESTER') this.runDefault();else if (this.bodyType === 'BODY_UPGRADER') this.runDefault();else if (this.bodyType === 'BODY_CARRIER') this.runDefault();else if (this.bodyType === 'BODY_CARRIER_TINY') this.runDefault();else if (this.bodyType === 'BODY_HEALER') this.runHealer();else if (this.bodyType === 'BODY_RANGER') this.runRanger();else this.logError("has no body type");
};

// ########### MOVE SECTION ###########################################

Creep.prototype.movePredefined = function (targetPos) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var range = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

    if (range === 0 || !this.pos.inRangeTo(targetPos, range)) {
        opts.reusePath = 6;
        opts.avoid = this.room.getUnsavePostions();
        var result = this.moveTo(targetPos, opts);
        if (result === ERR_NO_PATH) {
            opts.ignoreCreeps = true;
            result = this.moveTo(targetPos, opts);
            if (result === ERR_NO_PATH) {
                Logger.logDebug(result);
                this.moveRandom();
            }
        }
    }
};

Creep.prototype.getBodyType = function () {
    return this.bodyType;
};

Creep.prototype.getBodyPartCnt = function (type) {
    var cnt = 0;
    for (var i in this.body) if (this.body[i].type === type && this.body[i].hits > 0) ++cnt;
    return cnt;
};

Creep.prototype.moveAround = function () {
    if (this.pos.x === 1) this.move(RIGHT);else if (this.pos.x === 48) this.move(LEFT);else if (this.pos.y === 1) this.move(BOTTOM);else if (this.pos.y === 48) this.move(TOP);else this.move(Game.time % 8 + 1);
};

Creep.prototype.moveRandom = function () {
    this.move(Math.floor(Math.random() * 8) % 8 + 1);
};

// ########### ENERGY SECTION ###########################################

Creep.prototype.fillOnStructure = function (structure) {
    if (structure instanceof StructureSpawn) {
        this.movePredefined(structure.pos);
        if (structure.room.isEnergyMax()) structure.transferEnergy(this);
    } else if (structure instanceof StructureLink) {
        this.movePredefined(structure.pos);
        structure.transferEnergy(this);
    } else if (structure instanceof StructureStorage) {
        this.movePredefined(structure.pos);
        structure.transfer(this, RESOURCE_ENERGY);
    } else {
        this.logError("structure type " + typeof structure + " is not implemented.");
    }
};

Creep.prototype.fillStructure = function (structure) {
    if (structure instanceof StructureStorage || structure instanceof StructureLink || structure instanceof StructureSpawn || structure instanceof StructureExtension) {
        this.movePredefined(structure.pos);
        this.transfer(structure, RESOURCE_ENERGY);
    } else {
        this.logError("this structure is not available");
    }
};

// ########### LOGGING SECTION ############################################
Creep.prototype.log = function (message) {
    Logger.log('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
};
Creep.prototype.logError = function (message) {
    Logger.logError('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
};

// ########### DEFAULT SECTION ############################################

Creep.prototype.runDefault = function () {
    if (this.memory.phase === undefined || this.memory.phase === 'PHASE_SEARCH' || !this.getCurrentTask()) {
        this.memory.phase = 'PHASE_SEARCH';
    }

    if (this.memory.phase === 'PHASE_SEARCH') {
        this.moveAround();
    }
    if (this.memory.phase === 'PHASE_TASK') {
        //this.say(this.getCurrentTask().getType());
        switch (this.getCurrentTask().getType()) {
            case 'TASK_HARVEST':
                this.taskHarvest();break;
            case 'TASK_COLLECT':
                this.taskCollect();break;
            case 'TASK_GATHER':
                this.taskGather();break;
            case 'TASK_DELIVER':
                this.taskDeliver();break;
            case 'TASK_UPGRADE':
                this.taskUpgrade();break;
            case 'TASK_BUILD':
                this.taskBuild();break;
            case 'TASK_REPAIR':
                this.taskRepair();break;
            case 'TASK_FILLSTORAGE':
                this.taskFillStorage();break;
            case 'TASK_MOVE':
                this.taskMove();break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not available");
                return;
        }
    }
};

Creep.prototype.getCurrentTask = function () {
    while (!this.task && this.taskCodes.length > 0) {
        if (_.isString(this.taskCodes[0])) {
            this.task = this.room.getTasks().collection[this.taskCodes[0]];
            if (!(this.task instanceof CTask)) {
                this.moveAround();
                this.taskDisassign();
                this.logError("task " + this.taskCodes[0] + " not available");
            }
        } else {
            this.taskCodes.shift();
        }
    }
    return this.task;
};

Creep.prototype.taskAssign = function (task) {
    this.taskCodes.push(task.getCode());
    this.memory.phase = 'PHASE_TASK';
};

Creep.prototype.taskDisassign = function (task) {
    if (task instanceof CTask) {
        task.assignmentDelete(this.name);
        var i = this.taskCodes.indexOf(task.getCode());
        if (i >= 0) delete this.taskCodes[i];
    } else {
        // delete first task
        this.taskCodes.shift();
    }
    if (this.taskCodes.length === 0) {
        this.memory.phase = 'PHASE_SEARCH';
    }
    delete this.task;
};

Creep.prototype.hasTask = function (task) {
    if (this.memory.phase !== 'PHASE_TASK' || this.taskCodes.indexOf(task.getCode()) === -1) {
        return false;
    }
    return true;
};

Creep.prototype.taskHarvest = function () {
    if (this.bodyType === 'BODY_DEFAULT' && this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var source = this.getCurrentTask().getTarget();
    if (source !== null) {
        var link = Game.getObjectById(source.getMemory().linkId);
        if (this.bodyType === 'BODY_HARVESTER' && this.carry.energy > 0 && link instanceof Structure) {
            this.movePredefined(link.pos);
            this.transfer(link, RESOURCE_ENERGY);
        } else {
            this.movePredefined(source.pos);
        }
        this.harvest(source);
    } else {
        this.logError("target source not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskCollect = function () {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            this.pickup(target);
            this.taskDisassign();
        }
    } else {
        this.logError("target collect item not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskGather = function () {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            target.transfer(this, RESOURCE_ENERGY);
            var energys = target.pos.lookFor('energy');
            if (energys.length && energys[0] instanceof Energy) this.pickup(energys[0]);
        }
    } else {
        this.logError("target gather creep not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskDeliver = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    var cur = 0,
        max = 0;
    if (target !== null) {
        switch (target.structureType) {
            case STRUCTURE_STORAGE:
                cur = target.store.energy;max = target.storeCapacity;break;
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
            case STRUCTURE_LINK:
                cur = target.energy;max = target.energyCapacity;break;
        }
    }
    if (cur < max) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            var result = this.transfer(target, RESOURCE_ENERGY);
            if (result === OK && this.getCurrentTask().getQty() <= this.carry.energy) this.getCurrentTask()['delete']();
            this.taskDisassign();
        } else if (this.carry.energy >= max - cur + 50) {
            var exts = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                filter: function filter(object) {
                    return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;
                }
            });
            if (exts.length && exts[0]) {
                var result = this.transfer(exts[0], RESOURCE_ENERGY);
                if (result === OK) {
                    var code = 'TASK_DELIVER' + "_" + exts[0].pos.x + "_" + exts[0].pos.y;
                    this.room.getTasks().del(code);
                }
            }
        }
    } else {
        this.logError("energy container not valid " + this.getCurrentTask().getCode());
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskUpgrade = function () {
    if (this.bodyType !== 'BODY_UPGRADER' && this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target instanceof StructureController) {
        if (this.bodyType === 'BODY_UPGRADER' && this.carry.energy < 25) {
            this.fillOnStructure(this.room.controllerRefill);
        } else {
            this.movePredefined(target, {}, 3);
        }
        this.upgradeController(target);
    } else {
        this.logError("target controller not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskBuild = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target instanceof ConstructionSite) {
        this.movePredefined(target.pos, {}, 3);
        var result = this.build(target);
        if (result !== OK && result !== ERR_NOT_IN_RANGE) {
            this.logError(this.name + " can't build " + result);
            if (result === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
        }
    } else {
        this.logError("target construction site not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskRepair = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        this.movePredefined(target.pos, {}, 3);
        var result = this.repair(target);
        if (result !== OK && result !== ERR_NOT_IN_RANGE) {
            this.logError(this.name + " can't repair " + result);
            if (result === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
        }
    } else {
        this.logError("target structure not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskFillStorage = function () {
    var link = this.getCurrentTask().getTarget();
    if (link instanceof Structure && this.room.controllerStorage instanceof Structure) {
        if (this.carry.energy > 0) {
            if (this.room.defaultSpawn.energy != this.room.defaultSpawn.energyCapacity) this.fillStructure(this.room.defaultSpawn);else this.fillStructure(this.room.controllerStorage);
        } else {
            if (link.energy <= 0) {
                if (this.bodyType !== 'BODY_CARRIER_TINY') {
                    this.getCurrentTask()['delete']();
                    this.taskDisassign();
                    return;
                } else this.moveAround();
            }
            this.fillOnStructure(link);
        }
    } else {
        this.logError("link or controllerStorage not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

Creep.prototype.taskMove = function () {
    var pos = this.getCurrentTask().getPos();
    if (pos instanceof RoomPosition) {
        if (pos === this.pos) {
            //this.getCurrentTask().delete();
            this.taskDisassign();
        } else {
            if (pos.roomName === this.room.name) {
                this.movePredefined(pos, {}, 0);
            } else {
                this.movePredefined(pos, {}, 0);
            }
        }
    } else {
        this.logError("room pos not valid");
        this.getCurrentTask()['delete']();
        this.taskDisassign();
    }
};

var methods = ['fillStructure', 'taskDisassign', 'taskUpgrade'];
for (var i in methods) {
    Profiler._.wrap('Creep', Creep, methods[i]);
    Logger._.wrap('Creep', Creep, methods[i]);
}
