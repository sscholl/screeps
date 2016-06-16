'use strict';

var Profiler = require('Profiler');
var Logger = require('Logger');

var CTask = require('CTask');
var CTasks = require('CTasks');

// ########### Room Tasks ############################################
Room.prototype.getTasks = function () {
    if (!(this._tasks instanceof CTasks)) {
        this._tasks = new CTasks(this);
    }
    return this._tasks;
};

Room.prototype.initTasksStatic = function () {
    for (var id in this.sources) {
        var source = this.sources[id];
        if (source.getMemory().isSave) {
            this.createTask('TASK_HARVEST', source.id, source.pos, 5, source.getSpotsCnt());
        }
    }
    if (this.controller instanceof Structure && this.controller.my) {
        this.createTask('TASK_UPGRADE', this.controller.id, this.controller.pos, 9 //this.controller.pos.getSpotsCnt()
        );
    } else {
            if (!this.defaultSpawn) {
                //No claimed controller
            }
        }
};

Room.prototype.initTasksDynamic = function () {
    var gatherEnergy = [];
    for (var i in this.creepsHarvester) {
        var creep = this.creepsHarvester[i];
        var task = creep.getCurrentTask();
        if (task instanceof CTask) {
            var source = task.getTarget();
            if (source instanceof Source) {
                this.createTask('TASK_GATHER', creep.id, creep.pos, source.getMemory().linkId ? 1 : 2);
                gatherEnergy.push(creep.pos);
            }
        }
    }
    for (var i in this.energy) {
        var energy = this.energy[i];
        if (gatherEnergy.indexOf(energy.pos) != -1) this.createTask('TASK_COLLECT', energy.id, energy.pos, energy.energy);
    }
    if (this.controller instanceof StructureController) {
        for (var i in this.extensions) {
            var ext = this.extensions[i];
            if (ext.energy < ext.energyCapacity) {
                this.createTask('TASK_DELIVER', ext.id, ext.pos, ext.energyCapacity - ext.energy);
            }
        }
        for (var i in this.spawns) {
            var spawn = this.spawns[i];
            if (spawn.energy < spawn.energyCapacity) {
                this.createTask('TASK_DELIVER', spawn.id, spawn.pos, spawn.energyCapacity - spawn.energy);
            }
        }
        if (this.storage instanceof Structure) {
            if (this.storage.store.energy < this.storage.storeCapacity) {
                this.createTask('TASK_DELIVER', this.storage.id, this.storage.pos, this.storage.storeCapacity - this.storage.store.energy);
                if (this.storageLink instanceof Structure && this.storageLink.energy >= 0) this.createTask('TASK_FILLSTORAGE', this.storageLink.id, this.storageLink.pos, 1);
            }
        }
    }
};

Room.prototype.initTasksDynamic2 = function () {
    if (this.controller instanceof Structure) {
        for (var i in this.constructions) {
            var construction = this.constructions[i];
            if (construction instanceof ConstructionSite) {
                this.createTask('TASK_BUILD', construction.id, construction.pos, construction.progressTotal - construction.progress, construction.pos.getSpotsCnt());
            }
        }
    }
};

Room.prototype.createTask = function (type, targetId, pos, qty) {
    var cnt = arguments.length <= 4 || arguments[4] === undefined ? 9999 : arguments[4];

    var task = new CTask(type, targetId, pos, qty, cnt);
    this.getTasks().add(task);
};

Room.prototype.assignTasks = function (withHandshake) {
    var tasks = this.getTasks();
    tasks.sort();
    var taskList = tasks.getList();
    for (var i in taskList) {
        //taskList[i] is the taskCode
        var task = tasks.collection[taskList[i]];
        if (task instanceof CTask) {
            if (withHandshake) {
                var assignments = task.getAssignments();
                for (var creepName in assignments) {
                    var creep = Game.creeps[creepName];
                    if (!creep) {
                        task.assignmentDelete(creepName);
                    } else if (!creep.hasTask(task)) {
                        task.assignmentDelete(creepName);
                        creep.taskDisassign(task);
                    }
                }
            }
            while (task.getQtyAssigned() < task.getQty() && task.getAssignmentsCnt() < task.getCnt()) {
                var creep = task.assignmentSearch();
                if (creep instanceof Creep) {
                    task.assignmentCreate(creep);
                    creep.taskAssign(task);
                } else {
                    Logger.log("no creep found for task " + taskList[i]);
                    break;
                }
            }
        } else {
            Logger.logError('task ' + taskList[i] + ' not found during assignTasks.');
        }
    }
};

var methods = ['initTasksStatic', 'initTasksDynamic', 'initTasksDynamic2', 'assignTasks'];
for (var i in methods) {
    Profiler._.wrap('Room', Room, methods[i]);
    Logger._.wrap('Room', Room, methods[i]);
}
