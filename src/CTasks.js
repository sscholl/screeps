let CTask = require('CTask');

let CTasks = class CTasks {

    /**
     * Creates an instance of CTasks.
     *
     * @constructor
     * @this {CTasks}
     */
    constructor () {
        this.list = [];
        this.collection = {}
    }

    getList () {
        return this.list;
    }

    getCollection () {
        return this.collection;
    }

    getPositions () {
        var poss = [];
        for (var i in this.getCollection()) {
            poss.push(this.get(i).getPos());
        }
        return poss;
    }

    get (taskCode) {
        var task = this.collection[taskCode];
        if (task !== undefined) {
            if (task.constructor !== CTask) task.__proto__ = CTask.prototype;

            if ( task.valid() ) {
                return task;
            } else {
                logError("task " + taskCode + " is invalid and was removed from task list.");
                task.delete();
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    add (task) {
        var myTask = this.get(task.getCode());
        if (myTask === undefined) {
            this.list.push(task.getCode());
            this.collection[task.getCode()] = task;
        } else if (!myTask.equals(task)) {
            myTask.update(task);
        }
    }

    /**
     * deletes a task
     * @param {CTask, String} the task object or the task code
     */
    del (task) {
        var taskCode;
        if ( typeof task === 'string' )    taskCode = task;
        else if ( task instanceof CTask )  taskCode = task.getCode();
        else                               logError("Task invalid.");
        if (this.collection[taskCode] instanceof CTask) {
            this.list.splice(this.list.indexOf(taskCode), 1);
            delete this.collection[taskCode];
        } else {
            logError("Task does not exist.");
        }
    }

    sort () {
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
    }

    getCount () {
        return this.count = Object.keys(this.collection).length;;
    }

};

module.exports = CTasks;
