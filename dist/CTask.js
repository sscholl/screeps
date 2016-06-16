"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Profiler = require('Profiler');
var Logger = require('Logger');

var CTask = (function () {
    _createClass(CTask, [{
        key: 'multiTask',
        get: function get() {
            return { 'BODY_DEFAULT': false, 'BODY_HARVESTER': true, 'BODY_CARRIER': false, 'BODY_CARRIER_TINY': true, 'BODY_UPGRADER': true };
        }

        /**
         * Creates an instance of CTask.
         *
         * @constructor
         * @param {String}          type        [TASK_HARVEST|TASK_COLLECT|TASK_GATHER|TASK_DELIVER
         *                                      |'TASK_UPGRADE'|'TASK_BUILD'
         *                                      |'TASK_REPAIR'|'TASK_FILLSTORAGE']
         * @param {String}          targetId    ID of the target
         * @param {RoomPosition}    pos
         * @param {Number}          qty         see getQty
         * @param {Bool}            energySource    true if task generates energy, false if consumes energy
         * @this {CTasks}
         */
    }]);

    function CTask(type, targetId, pos, qty, cnt) {
        _classCallCheck(this, CTask);

        this.type = type;
        this.targetId = targetId;
        this.pos = pos;
        this.qty = qty;
        this.qtyAssigned = 0;
        this.cnt = cnt;

        // todo: add priority. e.g. Repair a rampart with 1M has low prio whereas a source with a little dmg has high prio

        // object of the form {creepName1: {qty1}, creepName2: {qty2}, ...}
        this.assignments = {};
        switch (this.type) {
            case 'TASK_HARVEST':
                this.bodyTypes = ['BODY_HARVESTER', 'BODY_DEFAULT'];
                this.energySource = true;
                break;
            case 'TASK_COLLECT':
            case 'TASK_GATHER':
                this.bodyTypes = ['BODY_CARRIER', 'BODY_DEFAULT'];
                this.energySource = true;
                break;
            case 'TASK_DELIVER':
                this.bodyTypes = ['BODY_CARRIER', 'BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_UPGRADE':
                this.bodyTypes = ['BODY_UPGRADER', 'BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_BUILD':
                this.bodyTypes = ['BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_REPAIR':
                this.bodyTypes = ['BODY_DEFAULT'];
                this.energySource = false;
                break;
            case 'TASK_FILLSTORAGE':
                this.bodyTypes = ['BODY_CARRIER_TINY', 'BODY_DEFAULT', 'BODY_CARRIER'];
                this.energySource = null;
                break;
            case 'TASK_MOVE':
                this.bodyTypes = ['BODY_CARRIER', 'BODY_DEFAULT'];
                this.energySource = null;
                break;
            default:
                this.logError('task type ' + type + ' not available.');
                return;
        }
    }

    _createClass(CTask, [{
        key: 'getType',
        value: function getType() {
            return this.type;
        }
    }, {
        key: 'getTarget',
        value: function getTarget() {
            return Game.getObjectById(this.targetId);
        }
    }, {
        key: 'getPos',
        value: function getPos() {
            if (this.pos.constructor !== RoomPosition) {
                this.pos.__proto__ = RoomPosition.prototype;
            }
            return this.pos;
        }

        /**
         * @return {Room}
         */
    }, {
        key: 'getRoom',
        value: function getRoom() {
            return Game.rooms[this.pos.roomName];
        }

        /**
         * Returns the qty of the task. This can express different values:
         * TASK_HARVEST: how many harvest spots are to occupy
         * TASK_COLLECT: how many dropped energy is available
         * TASK_GATHER: how many energy is carried by the creep
         * TASK_DELIVER: how many energy is needed at the target
         * TASK_UPGRADE: how many upgrade spots are to occupy
         * TASK_BUILD: how many energy is needed to complete the contruction
         * TASK_REPAIR: how many energy is needed to repair the structure
         * TASK_FILLSTORAGE: how many spots
         * @return {Number}
         */
    }, {
        key: 'getQty',
        value: function getQty() {
            return this.qty;
        }

        /**
         * Returns the qty that is already assigned to a creep.
         * @return {Number}
         */
    }, {
        key: 'getQtyAssigned',
        value: function getQtyAssigned() {
            //if (this.qtyAssigned === undefined) {
            var qtyAssigned = 0;
            _.forEach(this.getAssignments(), function (assignment) {
                qtyAssigned += assignment;
            });
            this.qtyAssigned = qtyAssigned;
            //}
            return this.qtyAssigned;
        }

        /**
         * Returns the number of maximum creeps on that task
         * @return {Number}
         */
    }, {
        key: 'getCnt',
        value: function getCnt() {
            return this.cnt;
        }
    }, {
        key: 'getAssignments',
        value: function getAssignments() {
            return this.assignments;
        }
    }, {
        key: 'getAssignmentsCnt',
        value: function getAssignmentsCnt() {
            return Object.keys(this.assignments).length;
        }
    }, {
        key: 'getBodyTypes',
        value: function getBodyTypes() {
            return this.bodyTypes;
        }

        /**
         * Generates a unique code of the task. (todo: multiple dropped energy should be added to an existing task)
         * @return {String}
         */
    }, {
        key: 'getCode',
        value: function getCode() {
            if (this.code === undefined) {
                if (this.getTarget() instanceof Creep) this.code = this.type + "_" + this.getTarget().name;else this.code = this.type + "_" + this.pos.x + "_" + this.pos.y;
            }
            return this.code;
        }
    }, {
        key: 'getPrio',
        value: function getPrio() {
            if (this.prio === undefined) {
                switch (this.type) {
                    case 'TASK_HARVEST':
                        this.prio = 50;break;
                    case 'TASK_COLLECT':
                        if (this.getTarget().energy >= 100) this.prio = 65;else this.prio = 60;
                        break;
                    case 'TASK_GATHER':
                        this.prio = 62;break;
                    case 'TASK_DELIVER':
                        if (this.getTarget().structureType === STRUCTURE_STORAGE || this.getTarget().structureType === STRUCTURE_CONTAINER) {
                            this.prio = 15;
                        } else if (this.getTarget() instanceof Spawn) {
                            if (this.getTarget().id === this.getRoom().memory.controllerRefillId) {
                                this.prio = 50;
                            } else {
                                this.prio = 56;
                            }
                        } else {
                            this.prio = 55;
                        }
                        break;
                    case 'TASK_UPGRADE':
                        this.prio = 10;break;
                    case 'TASK_BUILD':
                        this.prio = 30;break;
                    case 'TASK_REPAIR':
                        this.prio = 40;break;
                    case 'TASK_FILLSTORAGE':
                        this.prio = 20;break;
                    case 'TASK_MOVE':
                        this.prio = 5;break;
                    default:
                        this.logError('task type ' + type + ' not available.');
                        return;
                }
            }
            return this.prio;
        }

        // ########### CTask methods ############################################

        /**
         * Returns the best matching creep for this task
         * @return {Creep}
         */
    }, {
        key: 'assignmentSearch',
        value: function assignmentSearch() {
            var creep = null;
            var bodyTypes = this.getBodyTypes();
            for (var i in bodyTypes) {
                var bodyType = bodyTypes[i];
                var room = this.getRoom();
                if (!creep) {
                    if (this.multiTask[bodyType]) {
                        if (room.hasCreepFull(bodyType)) {
                            creep = this.getPos().findClosestCreep(bodyType);
                            if (!(creep instanceof Creep)) room.hasCreep(bodyType, true);
                        }
                    } else if (this.energySource === true) {
                        if (room.hasCreepEmpty(bodyType)) {
                            creep = this.getPos().findClosestCreepEmpty(bodyType);
                            if (!(creep instanceof Creep)) room.hasCreepEmpty(bodyType, true);
                        }
                    } else if (this.energySource === false) {
                        if (room.hasCreepFull(bodyType)) {
                            creep = this.getPos().findClosestCreepFull(bodyType);
                            if (!(creep instanceof Creep)) room.hasCreepFull(bodyType, true);
                        }
                    } else {
                        if (room.hasCreepFull(bodyType)) {
                            creep = this.getPos().findClosestCreep(bodyType);
                            if (!(creep instanceof Creep)) room.hasCreep(bodyType, true);
                        }
                    }
                }
            }
            return creep;
        }

        /**
         * assign a creep to this task.
         * the selected qty depends on the capabilities of the creep
         * @param {Creep} creep the creep, that shoud do this task
         */
    }, {
        key: 'assignmentCreate',
        value: function assignmentCreate(creep) {
            var qty = 0;
            switch (this.type) {
                case 'TASK_HARVEST':
                    if (creep.getBodyType() === 'BODY_HARVESTER') qty = creep.getBodyPartCnt(WORK);else qty = 1;
                    break;
                case 'TASK_COLLECT':
                case 'TASK_GATHER':
                    qty = 1;break;
                case 'TASK_DELIVER':
                    qty = creep.carry.energy;break;
                case 'TASK_UPGRADE':
                    qty = 1;break;
                case 'TASK_BUILD':
                    qty = creep.carry.energy * 100;break;
                case 'TASK_REPAIR':
                    qty = creep.carry.energy;break;
                case 'TASK_FILLSTORAGE':
                    qty = 1;break;
                case 'TASK_MOVE':
                    qty = 1;break;
                default:
                    this.logError("Can't assign task, type " + type + " not available.");
                    return;
            }
            if (qty > this.qty) qty = this.qty;
            this.assignments[creep.name] = qty;
            delete this.qtyAssigned;
        }

        /**
         * Delete an assignment of a creep from the task.
         * @param {Creep} creep
         */
    }, {
        key: 'assignmentDelete',
        value: function assignmentDelete(creepName) {
            delete this.assignments[creepName];
            delete this.qtyAssigned;
        }

        /**
         * Checks if the Task is the same.
         * @param {CTask} task
         * @return {Boolean}
         */
    }, {
        key: 'valid',
        value: function valid() {
            if (this.getTarget() instanceof RoomObject) return true;else return false;
        }

        /**
         * Checks if the Task is the same.
         * @param {CTask} task
         * @return {Boolean}
         */
    }, {
        key: 'equals',
        value: function equals(task) {
            if (this.type === task.type && this.targetId === task.targetId && this.pos === task.pos && this.qty === task.qty //qty can change
             && this.cnt === task.cnt && this.bodyTypes === task.bodyTypes && this.energySource === task.energySource) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * Updates the task by new values like qty
         * @param {CTask} task
         */
    }, {
        key: 'update',
        value: function update(task) {
            this.type = task.type;
            this.targetId = task.targetId;
            this.pos = task.pos;
            this.qty = task.qty;
            this.cnt = task.cnt;
            this.bodyTypes = task.bodyTypes;
            this.energySource = task.energySource;
        }

        /**
         * Delete this task from room's task collection
         */
    }, {
        key: 'delete',
        value: function _delete() {
            this.getRoom().getTasks().del(this);
        }
    }]);

    return CTask;
})();

module.exports = CTask;

var methods = ['assignmentSearch'];
for (var i in methods) {
    Profiler._.wrap('CTask', CTask, methods[i]);
    Logger._.wrap('CTask', CTask, methods[i]);
}
