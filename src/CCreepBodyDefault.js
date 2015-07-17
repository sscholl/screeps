
Creep.prototype.runDefault = function() {
    if (
        this.memory.phase === undefined
        || this.memory.phase === PHASE_SEARCH
        || !this.getTask()
    ) {
        this.memory.phase = PHASE_SEARCH;
    }
    
    if (this.memory.phase === PHASE_SEARCH) {
        this.moveAround();
    }
    if (this.memory.phase === PHASE_TASK) {
        this.say("do my task");
        switch (this.getTask().getType()) {
            case TASK_HARVEST: this.taskHarvest(); break;
            case TASK_COLLECT: break;
            case TASK_DELIVER: break;
            case TASK_UPGRADE: break;
            case TASK_BUILD:   break;
            case TASK_REPAIR:  break;
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
    this.memory.phase = PHASE_TASK;
}

Creep.prototype.taskDisassign = function() {
    this.memory.phase = PHASE_SEARCH;
    delete this.memory.taskCode;
    delete this.task;
}

Creep.prototype.taskHarvest = function() {
    var source = this.getTask().getTarget();
    if ( source != null ) {
        //this.say(this.memory.harvesterSourceId);
        this.movePredefined(source.pos);
        this.harvest(source);
    } else {
        this.taskDisassign();
    }
}



Creep.prototype.changeCollector = function() {
    this.memory.role = 'collector';
    this.memory.phase = 'collect';
    LOG_DETAIL_THIS("add a collector")
}