"use strict";

let Logger = require('Logger');
let Profiler = require('Profiler');

let CTask = require('CTask');

module.exports = function () {
    if ( Creep._initDebug !== true ) {
        Creep._initDebug = true;
        var methods = [];//['fillStructure', 'taskDisassign', 'taskUpgrade', 'taskBuild'];
        for (var i in methods) {
            Profiler._.wrap('Creep', Creep, methods[i]);
            Logger._.wrap('Creep', Creep, methods[i]);
        }
    }
}


/**
 * add getter and setter for memory
 */
Object.defineProperty(Creep.prototype, "bodyType", {
    get: function bodyType() {
        if (this.memory.body === undefined) {
            var work = this.getBodyPartCnt(WORK);
            var move = this.getBodyPartCnt(MOVE);
            var carry = this.getBodyPartCnt(CARRY);
            var rattack = this.getBodyPartCnt(RANGED_ATTACK);
            var heal = this.getBodyPartCnt(HEAL);
            if ( work > 0 ) {
                if ( work === carry )               this.memory.body = 'BODY_DEFAULT';
                else if ( work <= 5 )               this.memory.body = 'BODY_HARVESTER';
                else                                this.memory.body = 'BODY_UPGRADER';
            } else if ( carry > 0 ) {
                if ( carry === 1 && move === 1 )    this.memory.body = 'BODY_CARRIER_TINY';
                else                                this.memory.body = 'BODY_CARRIER';
            } else if ( rattack > 0 ) {
                this.memory.body = 'BODY_RANGER';
            } else if ( heal > 0 ) {
                this.memory.body = 'BODY_HEALER';
            } else {
                this.logError('can not assign body by body parts.');
            }
        }
        return this.memory.body;
    },
    set: function bodyType(v) {
        this.memory.body = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "taskCodes", {
    get: function taskCodes() {
        if (this.memory.taskCodes === undefined)
            this.memory.taskCodes = [];
        return this.memory.taskCodes;
    },
    set: function taskCodes(v) {
        this.memory.taskCodes = v;
    },
});

/**
 * add getter and setter for master task code
 */
Object.defineProperty(Creep.prototype, "taskMasterCode", {
    get: function taskCodes() {
        return this.memory.taskMasterCode;
    },
    set: function taskCodes(v) {
        this.memory.taskMasterCode = v;
    },
});

// ########### GENERAL SECTION #########################################

Creep.prototype.run = function () {
    if      (this.bodyType === 'BODY_DEFAULT')      this.runDefault();
    else if (this.bodyType === 'BODY_HARVESTER')    this.runDefault();
    else if (this.bodyType === 'BODY_UPGRADER')     this.runDefault();
    else if (this.bodyType === 'BODY_CARRIER')      this.runDefault();
    else if (this.bodyType === 'BODY_CARRIER_TINY') this.runDefault();
    else if (this.bodyType === 'BODY_HEALER')       this.runHealer();
    else if (this.bodyType === 'BODY_RANGER')       this.runRanger();
    else                                            this.logError("has no body type");
}

// ########### MOVE SECTION ###########################################

Creep.prototype.movePredefined = function (targetPos, opts = {}, range = 1) {
    if ( range === 0 || ! this.pos.inRangeTo(targetPos, range)) {
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
}

Creep.prototype.getBodyType = function () {
    return this.bodyType;
}

Creep.prototype.getBodyPartCnt = function (type) {
    var cnt = 0;
    for (var i in this.body)
        if (this.body[i].type === type && this.body[i].hits > 0)
            ++ cnt;
    return cnt;
}

Creep.prototype.moveAround = function () {
    if (this.pos.x === 1)  this.move(RIGHT);
    else if (this.pos.x === 48) this.move(LEFT);
    else if (this.pos.y === 1)  this.move(BOTTOM);
    else if (this.pos.y === 48) this.move(TOP);
    else this.move(Game.time % 8 + 1);
}

Creep.prototype.moveRandom = function () {
    this.move(Math.floor(Math.random() * 8) % 8 + 1);
}

Creep.prototype.flee = function (range) {
    let enemies = this.room.find(FIND_HOSTILE_CREEPS);
    //console.log(this,'fleeing')
    let avoid = _.map(enemies,function (t) {return {'pos':t.pos,'range':range};});
    let res = PathFinder.search(this.pos,avoid,{flee:true,plainCost:2,swampCost:10,maxOps:2500*2});
    this.moveTo(res.path[0]);
};

// ########### ENERGY SECTION ###########################################

Creep.prototype.fillOnStructure = function (structure) {
    var r = -99;
    if ( structure instanceof StructureSpawn ) {
        this.movePredefined(structure.pos);
        if ( structure.room.isEnergyMax() )
            r = structure.transferEnergy(this);
    } else if ( structure instanceof StructureLink ) {
        this.movePredefined(structure.pos);
        r = structure.transferEnergy(this);
    } else if ( structure instanceof StructureStorage || structure instanceof StructureContainer ) {
        this.movePredefined(structure.pos);
        r = structure.transfer(this, RESOURCE_ENERGY);
    } else {
        this.logError("structure type " + typeof structure + " is not implemented.");
    }
    return r;
}

Creep.prototype.fillStructure = function (structure) {
    var r = -99;
    if ( structure instanceof StructureStorage || structure instanceof StructureLink || structure instanceof StructureSpawn || structure instanceof StructureExtension || structure instanceof StructureTower ) {
        this.movePredefined(structure.pos);
        r = this.transfer(structure, RESOURCE_ENERGY);
    } else {
        this.logError("this structure is not available");
    }
    return r;
}

// ########### LOGGING SECTION ############################################
Creep.prototype.log = function (message) {
    Logger.log('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}
Creep.prototype.logError = function (message) {
    Logger.logError('[' + this.room.name + '] ' + '[' + this.name + '] ' + message);
}


// ########### DEFAULT SECTION ############################################

Creep.prototype.runDefault = function () {
    if (
        this.memory.phase === undefined
        || this.memory.phase === 'PHASE_SEARCH'
        || ! this.getCurrentTask()
    ) {
        this.memory.phase = 'PHASE_SEARCH';
    }

    if (this.memory.phase === 'PHASE_SEARCH') {
        if ( this.energy < 50 && (this.bodyType === 'BODY_DEFAULT' || this.bodyType === 'BODY_DEFAULT' || this.bodyType === 'BODY_DEFAULT') ) {
            this.fillOnStructure(this.room.controllerRefill);
        } else {
            var collectionPoint = Game.flags[this.room.name];
            if (collectionPoint) {
                this.movePredefined(collectionPoint.pos, {}, 0);
            } else {
                this.moveAround();
            }
        }
    }
    if (this.memory.phase === 'PHASE_TASK') {
        //this.say(this.getCurrentTask().getType());
        switch (this.getCurrentTask().getType()) {
            case 'TASK_HARVEST':      this.taskHarvest();  break;
            case 'TASK_COLLECT':      this.taskCollect();  break;
            case 'TASK_GATHER':       this.taskGather();  break;
            case 'TASK_DELIVER':      this.taskDeliver();  break;
            case 'TASK_UPGRADE':      this.taskUpgrade();  break;
            case 'TASK_BUILD':        this.taskBuild();    break;
            case 'TASK_REPAIR':       this.taskRepair();   break;
            case 'TASK_FILLSTORAGE':  this.taskFillStorage();   break;
            case 'TASK_MOVE':         this.taskMove();   break;
            case 'TASK_HARVEST_REMOTE':
            case 'TASK_GATHER_REMOTE':
            case 'TASK_RESERVE_REMOTE':  this.taskMove();   break;
            case 'TASK_RESERVE':         this.taskReserve();   break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not available");
                return;
        }
    }
};

Creep.prototype.getCurrentTask = function () {
    while ( ! this.task && this.taskCodes.length > 0 ) {
        if ( _.isString(this.taskCodes[0]) ) {
            this.task = this.room.getTasks().collection[this.taskCodes[0]];
            if ( ! (this.task instanceof CTask) ) {
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
    this.taskCodes = new Array(task.getCode()).concat(this.taskCodes);
    this.memory.phase = 'PHASE_TASK';
    if (task.getType() === 'TASK_HARVEST_REMOTE' || task.getType() === 'TASK_GATHER_REMOTE' || task.getType() === 'TASK_RESERVE_REMOTE') {
        this.taskMaster();
    }
};

Creep.prototype.taskDisassign = function (task) {
    if (task instanceof CTask) {
        task.assignmentDelete(this.name);
        var i = this.taskCodes.indexOf(task.getCode());
        if (i >= 0) delete this.taskCodes[i];
    } else { // delete first task
        this.taskCodes.shift();
    }
    if ( this.taskCodes.length === 0) {
        this.memory.phase = 'PHASE_SEARCH';
    }
    delete this.task;
};

Creep.prototype.taskMaster = function (task) {
    if (task instanceof CTask) {
        this.taskMasterCode = task.getCode();
    } else if (this.taskCodes.length) {
        this.taskMasterCode = this.taskCodes[0];
    }
};

Creep.prototype.hasTask = function (task) {
    if (task.getType() === 'TASK_HARVEST_REMOTE' || task.getType() === 'TASK_GATHER_REMOTE') {
        this.log();
        Logger.logDebug(this.taskCodes.indexOf(task.getCode()) !== -1 || (this.taskMasterCode === task.getCode() && this.room.name !== task.pos.roomName));
    }
    return this.taskCodes.indexOf(task.getCode()) !== -1 || (this.taskMasterCode === task.getCode() && this.room.name !== task.pos.roomName);
};

Creep.prototype.taskHarvest = function () {
    if (this.bodyType === 'BODY_DEFAULT' && this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var source = this.getCurrentTask().getTarget();
    if ( source !== null ) {
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
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskCollect = function () {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target instanceof Energy) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            this.pickup(target);
            this.taskDisassign();
        }
    } else {
        this.logError("target collect item not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskGather = function () {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target instanceof Creep) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            target.transfer(this,RESOURCE_ENERGY);
            var energys = target.pos.lookFor('energy');
            if (energys.length && energys[0] instanceof Energy)
                this.pickup(energys[0]);
        }
    } else {
        this.logError("target gather creep not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskDeliver = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    var cur = 0, max = 0;
    if (target !== null) {
        switch (target.structureType) {
            case STRUCTURE_STORAGE:
            case STRUCTURE_CONTAINER:
                cur = target.store.energy; max = target.storeCapacity; break;
            case STRUCTURE_TOWER:
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
            case STRUCTURE_LINK:
                cur = target.energy; max = target.energyCapacity; break;
        }
    }
    if (cur < max) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            var result = this.transfer(target,RESOURCE_ENERGY);
            if ( result === OK && this.getCurrentTask().getQty() <= this.carry.energy )
                this.getCurrentTask().delete();
            this.taskDisassign();
        } else if (this.carry.energy >= max - cur + 50) {
            var exts = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                filter: function (object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
            });
            if (exts.length && exts[0]) {
                var result = this.transfer(exts[0],RESOURCE_ENERGY);
                if ( result === OK ) {
                    var code = 'TASK_DELIVER' + "_" + exts[0].pos.x + "_" + exts[0].pos.y;
                    this.room.getTasks().del(code);
                }
            }
        }
    } else {
        this.logError("energy container not valid " + this.getCurrentTask().getCode());
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskUpgrade = function () {
    if ( this.bodyType !== 'BODY_UPGRADER' && this.carry.energy <= 0 ) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if ( target instanceof StructureController ) {
        // Creep uses 1 Energy per WORK body Part
        if ( this.bodyType === 'BODY_UPGRADER' && this.carry.energy < this.getActiveBodyparts(WORK) * 2 ) {
            var r = this.fillOnStructure(this.room.controllerRefill);
            if ( r !== OK && r !== ERR_NOT_IN_RANGE )  this.taskDisassign();
        } else {
            this.movePredefined(target, {}, 3);
        }
        this.upgradeController(target);
    } else {
        this.logError("target controller not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskBuild = function () {
//    if ( this.bodyType !== 'BODY_UPGRADER' && this.carry.energy <= 0 ) {
//        this.taskDisassign();
//        return;
//    }
    var target = this.getCurrentTask().getTarget();
    if (target instanceof ConstructionSite) {
        if ( this.carry.energy <= 0) {
            var r = this.fillOnStructure(this.room.controllerRefill);
            if ( r !== OK || this.room.controllerRefill.isEmpty() )  this.taskDisassign();
            else return;
        } else {
            this.movePredefined(target, {}, 3);
        }
        var construction = this.pos.findInRange(this.room.constructions, 3);
        if (construction instanceof ConstructionSite && construction.structureType === STRUCTURE_WALL && construction.structureType === STRUCTURE_ROAD && construction.structureType === STRUCTURE_RAMPART) {
            var r = this.build(construction);
        } else {
            var r = this.build(target);
            if (r !== OK && r !== ERR_NOT_IN_RANGE) {
                this.logError(this.name + " can't build " + r);
                if (r === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
            }
        }
    } else {
        this.logError("target construction site not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskRepair = function () {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target instanceof Structure) {
        if (target.hits >= target.hitsMax) {
            this.getCurrentTask().delete();
            this.taskDisassign();
        } else {
            this.movePredefined(target.pos, {}, 3);
            var result = this.repair(target);
            if (result !== OK && result !== ERR_NOT_IN_RANGE) {
                this.logError(this.name + " can't repair " + result);
                if (result === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
            }
        }
    } else {
        this.logError("target structure not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskFillStorage = function () {
    var link = this.getCurrentTask().getTarget();
    if (link instanceof StructureLink && this.room.storage instanceof StructureStorage) {
        if (this.carry.energy > 0) {
            var tower = undefined;
            for (var i in this.room.towers)
                if ( ! this.room.towers[i].isFull() ) {
                    tower = this.room.towers[i];
                    break;
                }
            if ( this.room.defaultSpawn.energy != this.room.defaultSpawn.energyCapacity )
                this.fillStructure(this.room.defaultSpawn)
            else if ( tower instanceof StructureTower )
                this.fillStructure(tower)
            else
                this.fillStructure(this.room.storage)
        } else {
            if (link.energy <= 0) {
                if (this.bodyType !== 'BODY_CARRIER_TINY') {
                    this.getCurrentTask().delete();
                    this.taskDisassign();
                    return;
                } else this.moveAround();
            }
            this.fillOnStructure(link);
        }
    } else {
        this.logError("storageLink or storage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskMove = function () {
    var pos = this.getCurrentTask().getPos();
    if (pos instanceof RoomObject) pos = pos.pos;
    if (pos instanceof RoomPosition) {
        if (pos === this.pos) {
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
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskReserve = function () {
    if ( this.bodyType !== 'BODY_CLAIM' ) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if ( target instanceof StructureController ) {
        this.movePredefined(target, {}, 1);
        var r = this.reserveController(target);
        if ( r !== OK )
            this.logError(this.name + " can't reserve " + result);
    } else {
        this.logError("target controller not valid for claim");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};
