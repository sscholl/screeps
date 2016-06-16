"use strict";

let Logger = require('Logger');

let CTask = require('CTask');

let CTasks = class CTasks {

    get room () { return this._room; }
    set room (room) { this._room = room; }

    get memory () {
        if (this._memory === undefined) {
            this._memory = Memory.rooms[this.room.name].tasks;
            if (this._memory === undefined)
                this._memory = this.memory = { list : [], collection: {}}; //TODO: check memory setter
        }
        return this._memory;
    }

    set memory (v) {
        Memory.rooms[this.room.name].tasks = v;
    }

    get list () {
        return this.memory.list;
    }
    set list (list) {
        this.memory.list = list;
    }

    get collection () {
        if (this._collection === undefined) {
            this._collection = this.memory.collection;
            for (var i in this._collection) this._collection[i].__proto__ = CTask.prototype;
        }
        return this._collection;
    }
    set collection (collection) {
        this.memory.collection = collection;
    }

    /**
     * Creates an instance of CTasks.
     *
     * @constructor
     * @this {CTasks}
     */
    constructor (room) {
        this.room = room;
    }

    getList () {
        return this.list;
    }

    getPositions () {
        var poss = [];
        for (var i in this.collection) {
            poss.push(this.collection[i].getPos());
        }
        return poss;
    }

    add (task) {
        var myTask = this.collection[task.getCode()];
        if (myTask === undefined) {
            if ( this.collection[task.getCode()] !== undefined ) {
                Logger.logError('task ' + task.getCode() + ' already exists!');
            } else {
                this.collection[task.getCode()] = task;
            }
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
        else                               Logger.logError("Task invalid.");
        if (this.collection[taskCode] instanceof CTask) {
            Logger.logError("Task del " + taskCode);
            delete this.collection[taskCode];
        } else {
            Logger.logError("Task does not exist.");
        }
    }

    sort () {
        this.list = [];
        for (var i in this.collection) {
            this.list.push(i);
        }
        var tasks = this;
        this.list.sort(
            function(taskCodeA, taskCodeB) {
                var a = 0, b = 0;
                var taskA = tasks.collection[taskCodeA];
                var taskB = tasks.collection[taskCodeB];
                if (taskA instanceof CTask) a = taskA.getPrio();
                else {Logger.logError("wrong task " + taskCodeA);
                    tasks.list.splice(tasks.list.indexOf(taskCodeA), 1);}
                if (taskB instanceof CTask) b = taskB.getPrio();
                else {Logger.logError("wrong task " + taskCodeB);
                    tasks.list.splice(tasks.list.indexOf(taskCodeB), 1);}
                return b - a;
            }
        );
    }

    getCount () {
        return this.count = Object.keys(this.collection).length;;
    }

};

module.exports = CTasks;
