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
    get: function () {
        if (this.memory.body === undefined) {
            var work = this.getBodyPartCnt(WORK);
            var move = this.getBodyPartCnt(MOVE);
            var carry = this.getBodyPartCnt(CARRY);
            var attack = this.getBodyPartCnt(ATTACK);
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
            } else if ( attack > 0 ) {
                this.memory.body = 'BODY_MELEE';
            } else if ( heal > 0 ) {
                this.memory.body = 'BODY_HEALER';
            } else {
                this.logError('can not assign body by body parts.');
            }
        }
        return this.memory.body;
    },
    set: function (v) {
        this.memory.body = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "tasks", {
    get: function () {
        if (this.memory.tasks === undefined)
            this.memory.tasks = {};
        return this.memory.tasks;
    },
    set: function (v) {
        this.memory.tasks = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "tasksMaster", {
    get: function () {
        if (this.memory.tasksMaster === undefined)
            this.memory.tasksMaster = {};
        return this.memory.tasksMaster;
    },
    set: function (v) {
        this.memory.tasksMaster = v;
    },
});

/**
 * add getter and setter for task codes
 */
Object.defineProperty(Creep.prototype, "taskCodes", {
    get: function () {
        if (this.memory.taskCodes === undefined)
            this.memory.taskCodes = [];
        return this.memory.taskCodes;
    },
    set: function (v) {
        this.memory.taskCodes = v;
    },
});

/**
 * add getter and setter for master task code
 */
Object.defineProperty(Creep.prototype, "taskCodesMaster", {
    get: function () {
        if (this.memory.taskCodesMaster === undefined)
            this.memory.taskCodesMaster = {};
        return this.memory.taskCodesMaster;
    },
    set: function (v) {
        this.memory.taskCodesMaster = v;
    },
});

Object.defineProperty(Creep.prototype, "posHandshake", {
    get: function () {
        if (this._posHandshake === undefined) {
            var targetPos = this.room.centerPos;
            var path = this.pos.findPathTo(targetPos, {ignoreCreeps:true});
            if ( path[0] ) {
                this._posHandshake = new RoomPosition(path[0].x, path[0].y, this.room.name);
            } else {
                this._posHandshake = this.pos;
                this.logError("no handshake spot for scree found");
            }
        }
        return this._posHandshake;
    },
});

// ########### GENERAL SECTION #########################################

Creep.prototype.run = function () {
    if ( this.spawning ) return;
    
    let r, collectionPoint;
    switch (this.bodyType) {
        case 'BODY_DEFAULT': case 'BODY_HARVESTER': case 'BODY_UPGRADER':
        case 'BODY_CARRIER': case 'BODY_CARRIER_TINY': case 'BODY_CLAIM':
            collectionPoint = Game.flags[this.room.name];
            r = this.generalActionWorker(); 
            break;
        case 'BODY_MELEE':  collectionPoint = Game.flags[this.room.name + '_M']; r = this.generalActionMelee(); break;
        case 'BODY_RANGER': collectionPoint = Game.flags[this.room.name + '_M']; r = this.generalActionRanger(); break;
        case 'BODY_HEALER': collectionPoint = Game.flags[this.room.name + '_M']; r = this.generalActionHealer(); break;
        default: this.logError("has no body type"); return;
    }
    if ( r ) return;
    
    
    if (
        this.memory.phase === undefined
        || this.memory.phase === 'PHASE_SEARCH'
        || ! this.getCurrentTask()
    ) {
        this.memory.phase = 'PHASE_SEARCH';
    }

    if (this.memory.phase === 'PHASE_SEARCH') {
        if ( this.energy < 50 && (this.bodyType === 'BODY_DEFAULT') ) {
            this.fillOnStructure(this.room.controllerRefill);
        } else {
            if (collectionPoint) {
                this.movePredefined(collectionPoint.pos, {}, 0);
            } else {
                this.moveAround();
            }
        }
    }
    if (this.memory.phase === 'PHASE_TASK') {
        //this.say(this.getCurrentTask().getCode());
        switch (this.getCurrentTask().getType()) {
            case 'TASK_HARVEST':      this.taskHarvest();  break;
            case 'TASK_COLLECT':      this.taskCollect();  break;
            case 'TASK_GATHER':       this.taskGather();  break;
            case 'TASK_DELIVER':      this.taskDeliver();  break;
            case 'TASK_UPGRADE':      this.taskUpgrade();  break;
            case 'TASK_BUILD':        this.taskBuild();    break;
            case 'TASK_REPAIR':       this.taskRepair();   break;
            case 'TASK_FILLSTORAGE':  this.taskFillStorage();   break;
            case 'TASK_RESERVE':      this.taskReserve();   break;
            case 'TASK_GUARD':        this.taskMoveAndStay();   break;
            case 'TASK_MOVE':         this.taskMoveAndStay();   break;
            case 'TASK_HARVEST_REMOTE':
            case 'TASK_GATHER_REMOTE':
            case 'TASK_RESERVE_REMOTE':  
            case 'TASK_GUARD_REMOTE': this.taskMoveAndStay();   break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not implemented.");
                return;
        }
    }
}

Creep.prototype.generalActionWorker = function () {
    //flee if near to enemy
    if ( this.room.getHostileCreeps().length ) {
        for ( var e of this.room.getHostileCreeps() ) {
            if ( this.pos.inRangeTo(e, 8) ) {
                this.flee(15);
                return true;
            }
        }
    }
}

// ########### MOVE SECTION ###########################################

Creep.prototype.movePredefined = function (targetPos, opts = {}, range = 1) {
    if ( ! targetPos || ! ( targetPos instanceof RoomPosition || targetPos.pos instanceof RoomPosition ) ) {
        this.logError("Can't move to " + targetPos);
        return ERR_NO_PATH;
    }
    if ( range === 0 || ! this.pos.inRangeTo(targetPos, range)) {
        opts.reusePath = 6;
        var r = this.moveTo(targetPos, opts);
        if (r === ERR_NO_PATH) {
            opts.ignoreCreeps = true;
            r = this.moveTo(targetPos, opts);
            if (r === ERR_NO_PATH) {
                this.logError("Can't find a way to " + JSON.stringifyOnce(targetPos) + ". Result Code:" + r);
                this.moveRandom();
            }
        }
        return r;
    } else {
        return OK;
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
    let enemies = this.room.getHostileCreeps();
    let avoid = _.map(enemies,function (t) {return {'pos':t.pos,'range':range};});
    let res = PathFinder.search(this.pos,avoid,{flee:true,maxOps:2500*2});
    if ( res.path[0] instanceof RoomPosition ) {
        this.moveTo(res.path[0]);
        this.log('fleeing to pos ' + res.path[0].x + "/" + res.path[0].y)
    }
};

// ########### ENERGY SECTION ###########################################

Creep.prototype.fillOnStructure = function (structure) {
    var r = -99;
    if ( structure instanceof StructureSpawn ) {
        this.movePredefined(structure.pos);
        if ( structure.room.isEnergyMax() )
            r = this.withdraw(structure, RESOURCE_ENERGY);
    } else if ( structure instanceof Structure ) {
        this.movePredefined(structure.pos);
        r = this.withdraw(structure, RESOURCE_ENERGY);
    } else {
        this.logError("structure " + typeof structure + " is not valid.");
    }
    return r;
}

Creep.prototype.fillStructure = function (structure) {
    var r = -99;
    if (
        structure instanceof StructureStorage || structure instanceof StructureLink 
        || structure instanceof StructureSpawn || structure instanceof StructureExtension 
        || structure instanceof StructureTower || structure instanceof StructureTerminal
        || structure instanceof StructureLab || structure instanceof StructureNuker
        || structure instanceof StructurePowerSpawn
    ) {
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


// ########### TASK SECTION ############################################

Creep.prototype.getCurrentTask = function () {
    while ( ! (this.task instanceof CTask) && this.taskCodes.length > 0 ) {
        if ( _.isString(this.taskCodes[0]) ) {
            this.task = this.room.getTasks().collection[this.taskCodes[0]];
            if ( ! (this.task instanceof CTask) ) {
                this.logError("task " + JSON.stringify(this.taskCodes) + " not available");
                this.moveAround();
                this.taskDisassign();
            }
        } else {
            this.taskCodes.shift();
        }
    }
    return this.task;
};

Creep.prototype.taskAssign = function (task) {
if (this.bodyType=="BODY_RANGER" || this.bodyType=="BODY_MELEE") {this.logError(this.bodyType);this.logError(task.getType());Logger.logDebug(task.getAssignments())}//return;throw new Error("TASK_GUARD_REMOTE_R_W13S36_G"); }
    this.taskCodesMaster[this.room.name] = undefined; // remove master task of this room, because creep is back in room
this.tasksMaster[this.room.name] = undefined; // remove master task of this room, because creep is back in room
    this.taskCodes = new Array(task.getCode()).concat(this.taskCodes);
this.tasks[task.getRoom().name] = this.tasks[task.getRoom().name] ? this.tasks[task.getRoom().name].concat([task.getCode()]) : [task.getCode()];
    this.memory.phase = 'PHASE_TASK';
    if (task.getType() === 'TASK_HARVEST_REMOTE' || task.getType() === 'TASK_GATHER_REMOTE' || task.getType() === 'TASK_RESERVE_REMOTE' || task.getType() === 'TASK_GUARD_REMOTE') {
        this.taskMaster(task);
    }
};

Creep.prototype.taskDisassign = function (task) {
    if ( ! task ) task = this.room.getTasks().collection[this.taskCodes[0]];
    if (task instanceof CTask) {
        task.assignmentDelete(this.name);
        var i = this.taskCodes.indexOf(task.getCode());
        if (i >= 0) delete this.taskCodes[i];
if (this.tasks[task.getRoom().name]) {
    var i = this.tasks[task.getRoom().name].indexOf(task.getCode());
    if (i >= 0) delete this.tasks[task.getRoom().name][i];
}
    } else { // delete first task
        this.taskCodes.shift();
if (this.tasks[this.room.name]) this.tasks[this.room.name].shift();
    }
    if ( this.taskCodes.length === 0) {
        this.memory.phase = 'PHASE_SEARCH';
    }
    delete this.task;
};

Creep.prototype.taskMaster = function (task) {
    if (task instanceof CTask) {
        this.taskCodesMaster[task.getRoom().name] = task.getCode();
this.tasksMaster[task.getRoom().name] = task.getCode();
    } else {
        this.logError("master task invalid: " + task);
    }
};

Creep.prototype.hasTask = function (task) {
    return this.taskCodes.indexOf(task.getCode()) !== -1 || (this.taskCodesMaster[task.getRoom().name] === task.getCode() && this.room.name !== task.roomName);
};

Creep.prototype.taskHarvest = function () {
    if (this.bodyType === 'BODY_DEFAULT' && this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var source = this.getCurrentTask().getTarget();
    if ( source !== null ) {
        if ( this.bodyType === 'BODY_HARVESTER' ) {
            this.moveTo(source.spot);
            if (this.carry.energy > 0 && source.link instanceof Structure )
                this.transfer(source.link, RESOURCE_ENERGY);
        } else {
            this.moveTo(source);
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
    let target = this.getCurrentTask().getTarget();
    if (target instanceof Creep) {
        if ( ! this.pos.inRangeTo(target.pos, 1) ) {
            let r = this.movePredefined(target.posHandshake, undefined, 0);
        } else {
            let r = target.transfer(this,RESOURCE_ENERGY);
            if ( target.getCurrentTask() ) {
                var c = target.getCurrentTask().getTarget().container
                if ( c )  this.withdraw(c, RESOURCE_ENERGY);
            }
            let energys = target.pos.lookFor('energy');
            if (energys.length && energys[0] instanceof Energy)
                this.pickup(energys[0]);
        }
    } else if (target instanceof Structure) {
        if ( this.pos.inRangeTo(target.pos, 1) ) {
            let r = this.withdraw(target,RESOURCE_ENERGY);
        } else {
            let r = this.movePredefined(target.pos);
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
    if (target instanceof Structure) {
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
                case STRUCTURE_LAB:
                    cur = target.energy; max = target.energyCapacity; break;
            }
        }
    }
    if (target instanceof Structure && cur < max) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            var result = this.transfer(target, RESOURCE_ENERGY);
            if ( result === OK && this.getCurrentTask().getQty() <= this.carry.energy ) this.getCurrentTask().delete();
            this.taskDisassign();
        } else if (this.carry.energy >= max - cur + 50) {
            var exts = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                filter: function (object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
            });
            if (exts.length && exts[0]) {
                var result = this.transfer(exts[0], RESOURCE_ENERGY);
                if ( result === OK ) {
                    var code = 'TASK_DELIVER' + "_" + exts[0].pos.x + "_" + exts[0].pos.y;
                    this.room.getTasks().del(code);
                }
            }
        }
    } else if (target instanceof Creep) {
        if ( ! target.getCurrentTask() || ! ( target.getCurrentTask().getType() === 'TASK_BUILD' || target.getCurrentTask().getType() === 'TASK_REPAIR' ) ) {
            this.getCurrentTask().delete();
            this.taskDisassign();
        } else {
            if ( ! this.pos.inRangeTo(target.pos, 1) ) {
                this.movePredefined(target.pos);
            } else {
                if (target.pos.inRangeTo(target.getCurrentTask().getTarget().pos), 3) {
                    var r = this.transfer(target, RESOURCE_ENERGY);
                    if ( r !== OK ) this.logError("can't deliver to " + target.name + ": " + r);
                }
            }
        }
    } else {
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
        var deliverTask = this.room.getTasks().collection['TASK_DELIVER_' + this.name];
        if ( ! (deliverTask instanceof CTask) ) {
            deliverTask = this.room.createTask( 'TASK_DELIVER', this, target.progressTotal - target.progress, 1 );
        }
        if ( this.carry.energy <= 0 && deliverTask.getAssignmentsCnt() === 0 ) {
            var r = this.fillOnStructure(this.room.controllerRefill);
            if ( r !== OK || this.room.controllerRefill.isEmpty() )  this.taskDisassign();
            else return;
        } else {
            this.movePredefined(target, {}, 3);
        }
        var construction = this.pos.findInRange(this.room.constructions, 3);
        if (construction instanceof ConstructionSite && construction.structureType === STRUCTURE_WALL && construction.structureType === STRUCTURE_ROAD && construction.structureType === STRUCTURE_RAMPART) {
            var r = this.build(construction);
        } else if ( this.carry.energy > 0 ) {
            var r = this.build(target);
            if (r !== OK && r !== ERR_NOT_IN_RANGE) {
                this.logError(this.name + " can't build " + r);
                if (r === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos); //heal
            }
        }
    } else {
        var deliverTask = this.room.getTasks().collection['TASK_DELIVER_' + this.name];
        if ( deliverTask instanceof CTask ) deliverTask.delete();
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
            let tower = undefined;
            for (let i of this.room.towers)
                if ( ! i.isFull() && link.pos.inRangeTo(i, 3) ) {
                    tower = i;
                    break;
                }
            if ( this.room.defaultSpawn && this.room.defaultSpawn.energy != this.room.defaultSpawn.energyCapacity ) {
                this.fillStructure(this.room.defaultSpawn);
            } else if ( tower instanceof StructureTower ) {
                this.fillStructure(tower);
            } else if ( this.room.terminal && this.room.terminal.store.energy < 100000 ) {
                this.fillStructure(this.room.terminal);
            } else {
                this.fillStructure(this.room.storage);
            }
        } else {
            if (link.energy <= 0) {
                if (this.bodyType !== 'BODY_CARRIER_TINY') {
                    this.getCurrentTask().delete();
                    this.taskDisassign();
                    return;
                } else {
                    this.moveAround();
                }
            }
            this.fillOnStructure(link);
        }
    } else {
        this.logError("storageLink or storage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskMoveAndStay = function () {
    var target = this.getCurrentTask().getTarget();
    if (target instanceof RoomObject) {
        let pos = target.pos;
        if ( ! this.pos.inRangeTo(pos, 0) ) {
            if (pos.roomName === this.room.name) {
                this.movePredefined(pos, {}, 0);
            } else {
                this.movePredefined(pos, {}, 0);
                this.logError("I'm in the wrong room.");
            }
        }
    } else {
        this.logError("move task: room pos not valid");
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
        if ( ! this.pos.inRangeTo(target.pos, 1) ) {
            this.movePredefined(target, {}, 1);
        } else {
            if ( target.owner ) {
                var r = this.attackController(target);
                if ( r !== OK ) this.logError(this.name + " can't attack " + r);
            } else {
                if (Game.flags['CLAIM_' + this.room.name] instanceof Flag) {
                    var r = this.claimController(target);
                    if ( r !== OK ) this.logError(this.name + " can't claim " + r);
                } else {
                    var r = this.reserveController(target);
                    if ( r !== OK ) this.logError(this.name + " can't reserve " + r);
                }
            }
        }
    } else {
        this.logError("target controller not valid for claim");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};