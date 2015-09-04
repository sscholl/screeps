
Creep.prototype.runDefault = function() {
    if (
        this.memory.phase === undefined
        || this.memory.phase === PHASE_SEARCH
        || !this.getCurrentTask()
    ) {
        this.memory.phase = PHASE_SEARCH;
    }
    
    if (this.memory.phase === PHASE_SEARCH) {
        this.moveAround();
    }
    if (this.memory.phase === PHASE_TASK) {
        //this.say(this.getCurrentTask().getType());
        switch (this.getCurrentTask().getType()) {
            case TASK_HARVEST:      this.taskHarvest();  break;
            case TASK_COLLECT:      this.taskCollect();  break;
            case TASK_GATHER:       this.taskGather();  break;
            case TASK_DELIVER:      this.taskDeliver();  break;
            case TASK_UPGRADE:      this.taskUpgrade();  break;
            case TASK_BUILD:        this.taskBuild();    break;
            case TASK_REPAIR:       this.taskRepair();   break;
            case TASK_FILLSTORAGE:  this.taskFillStorage();   break;
            case TASK_MOVE:         this.taskMove();   break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not available");
                return;
        }
    }
};

Creep.prototype.getCurrentTask = function() {
    this.getTaskCodes();
    if (!this.task && this.memory.taskCodes[0]) {
        this.task = this.room.getTasks().get(this.memory.taskCodes[0]);
        if (!(this.task instanceof CTask)) {
            this.moveAround();
            this.taskDisassign();
            this.logError("task " + this.memory.taskCodes[0] + " not available");
        }
    }
    return this.task;
};

Creep.prototype.taskAssign = function(task) {
    this.getTaskCodes().push(task.getCode());
    this.memory.phase = PHASE_TASK;
};

Creep.prototype.taskDisassign = function(task) {
    if (task instanceof CTask) {
        var i = this.memory.taskCodes.indexOf(task.getCode());
        if (i >= 0) delete this.memory.taskCodes[i];
    } else {
        // delete first task
        this.memory.taskCodes.shift();
    }
    if (!this.memory.taskCodes[0]) {
        this.memory.phase = PHASE_SEARCH;
    }
    delete this.task;
};

Creep.prototype.getTaskCodes = function() {
    if (!this.memory.taskCodes)
        this.memory.taskCodes = [];
    return this.memory.taskCodes;
};

Creep.prototype.hasTask = function(task) {
    if (   this.memory.phase !== PHASE_TASK
        || this.getTaskCodes().indexOf(task.getCode()) === -1
    ) {
        return false;
    }
    return true;
};

Creep.prototype.taskHarvest = function() {
    if (this.memory.body === BODY_DEFAULT && this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var source = this.getCurrentTask().getTarget();
    if ( source !== null ) {
        var link = Game.getObjectById(source.getMemory().linkId);
        if (this.memory.body === BODY_HARVESTER && this.carry.energy > 0 && link instanceof Structure) {
            this.movePredefined(link.pos);
            this.transferEnergy(link);
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

Creep.prototype.taskCollect = function() {
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
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskGather = function() {
    if (this.carry.energy >= this.carryCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            target.transferEnergy(this);
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

Creep.prototype.taskDeliver = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    var cur = 0, max = 0;
    if (target !== null) {
        switch (target.structureType) {
            case STRUCTURE_STORAGE: 
                cur = target.store.energy; max = target.storeCapacity; break;
            case STRUCTURE_EXTENSION:
            case STRUCTURE_SPAWN:
            case STRUCTURE_LINK:
                cur = target.energy; max = target.energyCapacity; break;
        }
    }
    if (cur < max) {
        this.movePredefined(target.pos);
        if (this.pos.inRangeTo(target.pos, 1)) {
            var result = this.transferEnergy(target);
            if ( result === OK && this.getCurrentTask().getQty() <= this.carry.energy )
                this.getCurrentTask().delete();
            this.taskDisassign();
        } else if (this.carry.energy >= max - cur + 50) {
            var exts = this.pos.findInRange(FIND_MY_STRUCTURES, 1, {
                filter: function(object) {return object.structureType == STRUCTURE_EXTENSION && object.energy != object.energyCapacity;}
            });
            if (exts.length && exts[0]) {
                var result = this.transferEnergy(exts[0]);
                if ( result === OK ) {
                    var code = TASK_DELIVER + "_" + exts[0].pos.x + "_" + exts[0].pos.y;
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

Creep.prototype.taskUpgrade = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        // todo add link logic
        this.movePredefined(target.pos);
        this.upgradeController(target);
    } else {
        this.logError("target controller not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskBuild = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        this.movePredefined(target.pos);
        var result = this.build(target);
        if (result !== OK && result !== ERR_NOT_IN_RANGE) {
            if (result === ERR_NO_BODYPART) this.movePredefined(this.room.defaultSpawn.pos);
            else this.logError(this.name + " can't build " + result);
        }
    } else {
        this.logError("target construction site not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskRepair = function() {
    if (this.carry.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        //TODO
        
    } else {
        this.logError("target structure not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskFillStorage = function() {
    var link = this.getCurrentTask().getTarget();
    if (link instanceof Structure && this.room.controllerStorage instanceof Structure) {
        if (this.carry.energy > 0) {
            this.fillStructure(this.room.controllerStorage)
        } else {
            if (link.energy <= 0) {
                if (this.memory.body === BODY_DEFAULT) {
                    this.getCurrentTask().delete();
                    this.taskDisassign();
                    return;
                } else this.moveAround();
            }
            this.fillOnStructure(link);
        }
    } else {
        this.logError("link or controllerStorage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskMove = function() {
    var pos = this.getCurrentTask().getPos();
    if (pos instanceof RoomPosition) {
        if (pos === this.pos) {
            //this.getCurrentTask().delete();
            this.taskDisassign();
        } else {
            if (pos.roomName === this.room.name) {
                this.movePredefined(pos, undefined, true);
            } else {
                this.movePredefined(pos, undefined, true);
            }
        }
    } else {
        this.logError("link or controllerStorage not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};