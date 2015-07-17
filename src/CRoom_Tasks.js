// ########### Room Tasks ############################################
Room.prototype.getTasks = function() {
    if (this.memory.tasks == undefined) {
        this.memory.tasks = new CTasks();
    }
    if (this.memory.tasks != CTask)
        this.memory.tasks.__proto__ = CTasks.prototype;
    return this.memory.tasks;
}

Room.prototype.initTasks = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initTasks', 'of room ' + this.name)
    for (var id in this.sources) {
        var source = this.sources[id];

        if (source.memory.isSave) {
            this.createTask(
                    TASK_HARVEST, 
                    source.id, 
                    source.pos, 
1 // source.memory.spots.length
            );
        }
    }
this.assignTasks();
    TIMER_END(TIMER_MODULE_ROOM, 'initTasks')
}

Room.prototype.createTask = function(type, targetId, pos, qty) {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'createTask', 'of room ' + this.name)
    var energySource = false;
    switch (type) {
        case TASK_HARVEST:
            energySource = true;
            break; 
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
    var task = new CTask(type, targetId, pos, qty, energySource);
    this.getTasks().add(task);

    TIMER_END(TIMER_MODULE_ROOM, 'createTask')
}

Room.prototype.assignTasks = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'assignTasks', 'of room ' + this.name)
    var tasks = this.getTasks().getCollection();
    for (var taskCode in tasks) {
        var task = tasks[taskCode];
LOG_DEBUG("task " + task.getCode());
        var assignments = task.getAssignments();
        for (var creepName in assignments) {
            var creep = Game.creeps[creepName];
            if (   !creep ) {
                task.assignmentDelete(creepName);
LOG_DEBUG("disassign task " + task.getCode());
            } else if (creep.memory.taskCode !== task.getCode()
                || creep.memory.phase !== PHASE_TASK
            ) {
                task.assignmentDelete(creepName);
                creep.taskDisassign();
LOG_DEBUG("AAAdisassign task " + task.getCode());
            } else {
//LOG_DEBUG("task " + task.getCode() + " is still assigned to " + creep.name);
            }
        }
LOG_DEBUG(task.assignments)
        while (task.getQtyAssigned() < task.getQty()) {
            creep = task.assignmentSearch();
            if (creep) {
LOG_DEBUG("assign task " + task.getCode() + " to " + creep.name);
                task.assignmentCreate(creep);
break;
            } else {
                break;
            }
        }
LOG_DEBUG(task.assignments)
    }

    TIMER_END(TIMER_MODULE_ROOM, 'assignTasks')
}