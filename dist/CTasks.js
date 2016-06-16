"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Logger = require('Logger');

var CTask = require('CTask');

var CTasks = (function () {
    _createClass(CTasks, [{
        key: 'room',
        get: function get() {
            return this._room;
        },
        set: function set(room) {
            this._room = room;
        }
    }, {
        key: 'memory',
        get: function get() {
            if (this._memory === undefined) {
                this._memory = Memory.rooms[this.room.name].tasks;
                if (this._memory === undefined) this._memory = this.memory = { list: [], collection: {} }; //TODO: check memory setter
            }
            return this._memory;
        },
        set: function set(v) {
            Memory.rooms[this.room.name].tasks = v;
        }
    }, {
        key: 'list',
        get: function get() {
            return this.memory.list;
        },
        set: function set(list) {
            this.memory.list = list;
        }
    }, {
        key: 'collection',
        get: function get() {
            if (this._collection === undefined) {
                this._collection = this.memory.collection;
                for (var i in this._collection) this._collection[i].__proto__ = CTask.prototype;
            }
            return this._collection;
        },
        set: function set(collection) {
            this.memory.collection = collection;
        }

        /**
         * Creates an instance of CTasks.
         *
         * @constructor
         * @this {CTasks}
         */
    }]);

    function CTasks(room) {
        _classCallCheck(this, CTasks);

        this.room = room;
    }

    _createClass(CTasks, [{
        key: 'getList',
        value: function getList() {
            return this.list;
        }
    }, {
        key: 'getPositions',
        value: function getPositions() {
            var poss = [];
            for (var i in this.collection) {
                poss.push(this.collection[i].getPos());
            }
            return poss;
        }
    }, {
        key: 'add',
        value: function add(task) {
            var myTask = this.collection[task.getCode()];
            if (myTask === undefined) {
                if (this.collection[task.getCode()] !== undefined) {
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
    }, {
        key: 'del',
        value: function del(task) {
            var taskCode;
            if (typeof task === 'string') taskCode = task;else if (task instanceof CTask) taskCode = task.getCode();else Logger.logError("Task invalid.");
            if (this.collection[taskCode] instanceof CTask) {
                Logger.logError("Task del " + taskCode);
                delete this.collection[taskCode];
            } else {
                Logger.logError("Task does not exist.");
            }
        }
    }, {
        key: 'sort',
        value: function sort() {
            this.list = [];
            for (var i in this.collection) {
                this.list.push(i);
            }
            var tasks = this;
            this.list.sort(function (taskCodeA, taskCodeB) {
                var a = 0,
                    b = 0;
                var taskA = tasks.collection[taskCodeA];
                var taskB = tasks.collection[taskCodeB];
                if (taskA instanceof CTask) a = taskA.getPrio();else {
                    Logger.logError("wrong task " + taskCodeA);
                    tasks.list.splice(tasks.list.indexOf(taskCodeA), 1);
                }
                if (taskB instanceof CTask) b = taskB.getPrio();else {
                    Logger.logError("wrong task " + taskCodeB);
                    tasks.list.splice(tasks.list.indexOf(taskCodeB), 1);
                }
                return b - a;
            });
        }
    }, {
        key: 'getCount',
        value: function getCount() {
            return this.count = Object.keys(this.collection).length;;
        }
    }]);

    return CTasks;
})();

module.exports = CTasks;
