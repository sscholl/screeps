
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
            case TASK_HARVEST: this.taskHarvest();  break;
            case TASK_COLLECT: this.taskCollect();  break;
            case TASK_DELIVER: this.taskDeliver();  break;
            case TASK_UPGRADE: this.taskUpgrade();  break;
            case TASK_BUILD:   this.taskBuild();    break;
            case TASK_REPAIR:  this.taskRepair();   break;
            default:
                this.logError("task type " + this.getCurrentTask().getType() + " not available");
                return;
        }
    }
};

Creep.prototype.getCurrentTask = function() {
    if (!this.task && this.memory.taskCodes[0]) {
        this.task = this.room.getTasks().get(this.memory.taskCodes[0]);
        if (!(this.task instanceof CTask)) {
            this.taskDisassign();
            this.logError("task " + this.memory.taskCodes[0] + " not available")
        }
    }
    return this.task;
};

Creep.prototype.taskAssign = function(task) {
    LOG_DEBUG(this.getTaskCodes())
    this.getTaskCodes().push(task.getCode());
    LOG_DEBUG(this.getTaskCodes())
    this.memory.phase = PHASE_TASK;
this.memory.role = 'NOROLE';
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
    if (this.memory.body === BODY_DEFAULT && this.energy >= this.energyCapacity) {
        this.taskDisassign();
        return;
    }
    var source = this.getCurrentTask().getTarget();
    if ( source !== null ) {
        this.movePredefined(source.pos);
        this.harvest(source);
    } else {
        this.logError("target not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskCollect = function() {
    if (this.energy >= this.energyCapacity) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target) {
        this.movePredefined(target.pos);
        this.pickup(target);
    } else {
        this.logError("target not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskDeliver = function() {
    if (this.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null && target.energy < target.energyCapacity) {
        this.movePredefined(target.pos);
        this.transferEnergy(target);
    } else {
        this.logError("target not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskUpgrade = function() {
    if (this.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        // todo add link logic
        this.movePredefined(target.pos);
        this.upgradeController(target);
    } else {
        this.logError("target not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskBuild = function() {
    if (this.energy <= 0) {
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
        this.logError("target not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};

Creep.prototype.taskRepair = function() {
    if (this.energy <= 0) {
        this.taskDisassign();
        return;
    }
    var target = this.getCurrentTask().getTarget();
    if (target !== null) {
        
        
    } else {
        this.logError("target not valid");
        this.getCurrentTask().delete();
        this.taskDisassign();
    }
};