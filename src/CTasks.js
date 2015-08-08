/**
 * Creates an instance of CTasks.
 *
 * @constructor
 * @this {CTasks}
 */
var CTasks = function CTasks()
{
    this.list = [];
    this.collection = {};
};

// ########### CTasks methods ############################################

CTasks.prototype.getList = function() {
    return this.list;
};
CTasks.prototype.getCollection = function() {
    return this.collection;
};
CTasks.prototype.get = function(taskCode) {
    var task = this.collection[taskCode];
    if (task && task.constructor !== CTask)
        task.__proto__ = CTask.prototype;
    return task;
};
CTasks.prototype.add = function(task) {
    var myTask = this.get(task.getCode());
    if (myTask === undefined) {
        this.list.push(task.getCode());
        this.collection[task.getCode()] = task;
    } else if (!myTask.equals(task)) {
        myTask.update(task);
    }
};
/**
 * deletes a task
 * @param {CTask, String} the task object or the task code
 */
CTasks.prototype.del = function(task) {
    var taskCode;
    if (task instanceof String) taskCode = task;
    else                        taskCode = task.getCode();
    if (this.get(taskCode)) {
        this.list.splice(this.list.indexOf(task.getCode()), 1);
        delete this.collection[taskCode];
    } else {
        this.logError("Task does not exist.");
    }
};

CTasks.prototype.sort = function() {
    var tasks = this;
    this.list.sort(
        function(taskCodeA, taskCodeB) {
            var a = 0, b = 0;
            var taskA = tasks.get(taskCodeA), taskB = tasks.get(taskCodeB);
            if (taskA instanceof CTask) a = taskA.getPrio();
            else logError("wrong task " + taskCodeA);
            if (taskB instanceof CTask) b = taskB.getPrio();
            else logError("wrong task " + taskCodeB);
            return b - a;
        }
    );
};

CTasks.prototype.getCount = function() {
    return this.count = Object.keys(this.collection).length;;
};