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
            this.createTask(TASK_HARVEST, source.id, source.pos, source.memory.spots.length);
        }
    }
    this.assignTasks();
    LOG_DEBUG(this.getTasks());
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
        var assignments = task.getAssignments();
        LOG_DEBUG(assignments)
    }

    TIMER_END(TIMER_MODULE_ROOM, 'assignTasks')
}