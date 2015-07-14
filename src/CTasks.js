/**
 * Creates an instance of CTasks.
 *
 * @constructor
 * @this {CTasks}
 */
var CTasks = function CTasks()
{
    this.collection = {};
}

// ########### CTasks methods ############################################

CTasks.prototype.getCollection = function() {
    return this.collection;
}
CTasks.prototype.get = function(taskCode) {
    var task = this.collection[taskCode];
    if (task && task.constructor != CTask)
        task.__proto__ = CTask.prototype;
    return task;
}
CTasks.prototype.add = function(task) {
    var myTask = this.get(task.getCode());
    if (myTask == undefined)        this.collection[task.getCode()] = task;
    else if (!myTask.equals(task))  myTask.update(task);
}
/**
 * deletes a task
 * @param {CTask, String} the task object or the task code
 */
CTasks.prototype.del = function(task) {
    var taskCode;
    if (task instanceof String) taskCode = task;
    else                        taskCode = task.getCode();
    if (this.getTask(taskCode)) delete this.collection[taskCode];
    else                        this.logError("Task does not exist.");
}

CTasks.prototype.getCount = function() {
    return this.count = Object.keys(this.collection).length;;
}