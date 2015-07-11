// ########### CTasks construtor #########################################
var CTasks = function CTasks(type, targetId, pos, qty, energySource, energySink)
{
}

// ########### CTasks methods ############################################

CTasks.prototype.get = function(taskCode) {
    var task = this[taskCode];
    if (task && task.constructor != CTask)
        task.__proto__ = CTask.prototype;
    return task;
}
CTasks.prototype.add = function(task) {
    var myTask = this.get(task.getCode());
    if (myTask == undefined) {
        this[task.getCode()] = task;
        this.incCount();
    } else if (!myTask.equals(task)) {
        myTask = task;
    }
}
CTasks.prototype.del = function(task) {
    var taskCode;
    if (task instanceof String) taskCode = task;
    else                        taskCode = task.getCode();
    if (this.getTask(taskCode)) {
        delete this[taskCode];
        this.decCount();
    } else {
        this.logError("Task does not exist.");
    }
}




CTasks.prototype.getCount = function() {
    if (this.count == undefined)
        this.count = 0;
    return this.count = 0;
}

CTasks.prototype.setTasksCount = function() {
    if (this.count == undefined)
        this.count = 0;
    this.count = 0;
}

CTasks.prototype.incCount = function() {
    if (this.count == undefined)
        this.count = 0;
    ++ this.count;
}

CTasks.prototype.decCount = function() {
    if (this.count == undefined)
        this.logError("Task count is invalid.");
    else
        -- this.count;
}