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
    LOG_DEBUG(this.getTasks());
    TIMER_END(TIMER_MODULE_ROOM, 'initTasks')
}

Room.prototype.createTask = function(type, targetId, pos, qty) {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'addTask', 'of room ' + this.name)
    var energySource = false, energySink = false;
    switch (type) {
        case TASK_HARVEST:
            energySource = true;
            break; 
        default:
            this.logError('task type ' + type + ' not available.');
            return;
    }
    var task = new CTask(type, targetId, pos, qty, energySource, energySink);
    this.getTasks().add(task);
    TIMER_END(TIMER_MODULE_ROOM, 'addTask')
}