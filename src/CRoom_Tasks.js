'use strict';

let Profiler = require('Profiler');
let Logger = require('Logger');

let CTask = require('CTask');
let CTasks = require('CTasks');

module.exports = function () {
    if ( Room._initDebugTasks !== true ) {
        Room._initDebugTasks = true;
        var methods = ['initTasksStatic', 'initTasksDynamic', 'initTasksDynamic2', 'assignTasks'];
        for (var i in methods) {
            Profiler._.wrap('Room', Room, methods[i]);
            Logger._.wrap('Room', Room, methods[i]);
        }
    }
}

// ########### Room Tasks ############################################
Room.prototype.getTasks = function() {
    if ( !(this._tasks instanceof CTasks) ) {
        this._tasks = new CTasks(this);
    }
    return this._tasks;
}

Room.prototype.initTasksStatic = function() {
    for ( var id in this.sources ) {
        var source = this.sources[id];
        if ( (this.controller instanceof StructureController && (this.controller.my || ! this.controller.owner)) && source.memory.isSave ) {
            this.createTask( 'TASK_HARVEST', source, 5, source.getSpotsCnt() );
        }
    }
    if ( this.controller instanceof Structure ) {
        if ( this.controller.my ) {
            let cnt = Math.ceil(this.controllerRefill ? this.controllerRefill.getEnergyPercentage() * 5 : 9);
            let qty = Math.ceil(this.controllerRefill ? this.controllerRefill.getEnergyPercentage() * 40 : 20);
            this.createTask( 'TASK_UPGRADE', this.controller, qty, cnt );
        } else if ( ! this.controller.owner ) {
            this.createTask( 'TASK_RESERVE', this.controller, 1, 1 );
        }
    } else {
        if (!this.defaultSpawn) {
            //No claimed controller
        }
    }
}

Room.prototype.initTasksDynamic = function() {
    var gatherEnergy = [];
    for (var i in this.creepsHarvester) {
        var creep = this.creepsHarvester[i];
        var task = creep.getCurrentTask();
        if ( task instanceof CTask  ) {
            var source = task.target;
            if ( source instanceof Source && creep.room.name === this.name ) {
                if ( ! (source.link && this.storage instanceof StructureStorage && this.storageLink instanceof StructureLink) ) {
                    var cnt = (source.centerDistance) / 3;
                    this.createTask( 'TASK_GATHER', creep, cnt, 10 );
                    gatherEnergy.push(creep.pos);
                }
            }
        }
    }
    for (var i in this.energy) {
        var energy = this.energy[i];
        var found = false;
        for (var j in gatherEnergy) if (gatherEnergy[j].isEqualTo(energy.pos) ) found = true;
        if( ! found )
            this.createTask( 'TASK_COLLECT', energy, energy.energy );
    }
    if ( this.controller instanceof StructureController ) {
        if ( this.controller.my ) {
            for (var i in this.extensions) {
                var ext = this.extensions[i];
                if (ext.energy < ext.energyCapacity) {
                    this.createTask( 'TASK_DELIVER', ext, ext.energyCapacity - ext.energy );
                }
            }
            for (var i in this.spawns) {
                var spawn = this.spawns[i];
                if (spawn.energy < spawn.energyCapacity) {
                    this.createTask( 'TASK_DELIVER', spawn, spawn.energyCapacity - spawn.energy );
                }
            }
            if (this.controllerRefill instanceof StructureContainer) {
                if (this.controllerRefill.store.energy < this.controllerRefill.storeCapacity) {
                    this.createTask( 'TASK_DELIVER', this.controllerRefill, this.controllerRefill.storeCapacity - this.controllerRefill.store.energy );
                }
            }
            if (this.storage instanceof StructureStorage) {
                if (this.storage.store.energy < this.storage.storeCapacity) {
                    this.createTask( 'TASK_DELIVER', this.storage, this.storage.storeCapacity - this.storage.store.energy );
                    if (this.storageLink instanceof StructureLink)
                        this.createTask( 'TASK_FILLSTORAGE', this.storageLink, 1, 1 );
                }
            }
            for (var i in this.towers) {
                var tower = this.towers[i];
                if (tower.energy < tower.energyCapacity) {
                    this.createTask( 'TASK_DELIVER', tower, tower.energyCapacity - tower.energy );
                }
            }
            for (let lab of this.labs)
                if (lab.energy < lab.energyCapacity)
                    this.createTask( 'TASK_DELIVER', lab, lab.energyCapacity - lab.energy );
        } else {
            if (this.storage instanceof StructureStorage) {
                if (this.storage.store.energy >= 50) {
                    this.createTask( 'TASK_GATHER', this.storage, this.storage.store.energy );
                }
            }
        }
    }
}

Room.prototype.initTasksDynamic2 = function() {
    let buildDefaultCnt = 0;
    let buildDefaultQty = 0;
    for ( var i in this.constructions ) {
        var construction = this.constructions[i];
        if ( construction instanceof ConstructionSite && construction.my ) {
            if ( construction.structureType === STRUCTURE_SPAWN ) {
                this.createTask( 'TASK_BUILD', construction, construction.progressTotal - construction.progress );
            } else {
                buildDefaultCnt ++;
                buildDefaultQty += construction.progressTotal - construction.progress;
            }
        }
    }
    if ( buildDefaultCnt ) {
        if ( buildDefaultCnt > 1 ) buildDefaultCnt = 1;
        let flagName = this.name + "_CONSTRUCT";
        if ( ! Game.flags[flagName] ) this.createFlag(24, 24, flagName, COLOR_ORANGE, COLOR_ORANGE);
        if ( Game.flags[flagName] )
            this.createTask( 'TASK_BUILD', Game.flags[flagName], buildDefaultQty, buildDefaultCnt );
        else
            this.logError("Can't create build default task.");
    }
        
    var structuresNeedsRepair = this.find(FIND_STRUCTURES, {
        filter: function(i) { return i.needsRepair(); }
    });
    for (var i in structuresNeedsRepair) {
        var structure = structuresNeedsRepair[i];
        if (structure instanceof Structure && ! structure instanceof StructureWall && ! structure instanceof StructureRampart ) {
            this.createTask( 'TASK_REPAIR', structure, structure.hitsMax - structure.hits );
        }
    }
    
    if ( this.flag && ( ! this.controller || (this.controller && this.controller.reservation)) ) {
        this.createTask( 'TASK_DELIVER', this.flag, 99999, 99999, 1 );
    }
        
    var flags = this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_YELLOW } });
    for ( var i in flags ) {
        var t = this.createTask( 'TASK_HARVEST_REMOTE', flags[i], 
            flags[i].memory.qty ? flags[i].memory.qty : undefined,
            flags[i].memory.cnt ? flags[i].memory.cnt : 1
        );
        flags[i].memory.taskCode = t.getCode();
    }
    var flags = this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_GREY } });
    for ( var i in flags ) {
        flags[i].memory.qty = flags[i].memory.qty ? flags[i].memory.qty : 15;
        flags[i].memory.qty = flags[i].memory.cnt ? flags[i].memory.cnt : 2;
        var t = this.createTask( 'TASK_GATHER_REMOTE', flags[i],
            flags[i].memory.qty,
            flags[i].memory.cnt
        );
        flags[i].memory.taskCode = t.getCode();
    }
    var flags = this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_ORANGE } });
    for ( var i in flags ) {
        var t = this.createTask( 'TASK_BUILD_REMOTE', flags[i],
            flags[i].memory.qty ? flags[i].memory.qty : 5,
            flags[i].memory.cnt ? flags[i].memory.cnt : 1
        );
        flags[i].memory.taskCode = t.getCode();
    }
    var flags = this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_PURPLE } });
    for ( var i in flags ) {
        var t = this.createTask( 'TASK_RESERVE_REMOTE', flags[i],
            flags[i].memory.qty ? flags[i].memory.qty : 2,
            flags[i].memory.cnt ? flags[i].memory.cnt : 1
        );
        flags[i].memory.taskCode = t.getCode();
    }
    var flags = this.find(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_GREY } });
    for ( var i in flags ) {
        var t = this.createTask( 'TASK_GUARD',
            flags[i], flags[i].memory.qty ? flags[i].memory.qty : 10,
            flags[i].memory.cnt ? flags[i].memory.cnt : 1
        );
        flags[i].memory.taskCode = t.getCode();
    }
    var flags = this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_RED } });
    for ( var i in flags ) {
        var t = this.createTask( 'TASK_GUARD_REMOTE', flags[i],
            flags[i].memory.qty ? flags[i].memory.qty : 10,
            flags[i].memory.cnt ? flags[i].memory.cnt : 1
        );
        flags[i].memory.taskCode = t.getCode();
    }
}
   
/**
 * Generates a unique code of the task. (todo: multiple dropped energy should be added to an existing task)
 * @return {String}
 */
Room.prototype.getTaskCode = function (type, target) {
    let code;
    if ( ! target ) {
        code = type + "_DEFAULT";
    } else if ( target instanceof Creep ) {
        code = type + "_" + target.name;
    } else if ( target instanceof Flag) {
        code = type + "_" + target.name;
    } else {
        code = type + "_" + target.pos.x + "_" + target.pos.y;
    }
    return code;
}

Room.prototype.createTask = function(type, target, qty = 9999, cnt = 9999, prio) {
    let code = this.getTaskCode(type, target);
    let task = this.getTasks().collection[code];
    if ( task === undefined ) {
        task = new CTask(code, this, type, target, [], qty, cnt, prio);
        this.getTasks().add(task);
    } else if ( ! task.equals(this, type, target, [], qty, cnt, prio)) {
        task.update(this, type, target, [], qty, cnt, prio);
    }
    return task;
}

Room.prototype.assignTasks = function(withHandshake) {
    var tasks = this.getTasks();
    tasks.sort();
    var taskList = tasks.getList();
    for (var i in taskList) { //taskList[i] is the taskCode
        var task = tasks.collection[taskList[i]];
        if ( task instanceof CTask ) {
            if ( task.valid() ) {
                if (withHandshake) {
                    var assignments = task.getAssignments();
                    for (var creepName in assignments) {
                        var creep = Game.creeps[creepName];
                        if ( ! creep ) {
                            task.assignmentDelete(creepName);
                        } else if ( ! creep.hasTask(task) ) {
                            task.assignmentDelete(creepName);
                            creep.taskDisassign(task);
                        }
                    }
                    //cleanup
                    if ( task.getQty() <= 0 || task.getCnt() <= 0 ) {
                        this.log("task " + task.getCode() + " is invalid.");
                        task.delete();
                    }
                }
                while (task.getQtyAssigned() < task.getQty() && task.getAssignmentsCnt() < task.getCnt() ) {
                    var creep = task.assignmentSearch();
                    if (creep instanceof Creep) {
                        task.assignmentCreate(creep);
                        creep.taskAssign(task);
                        //this.log("creep " + creep.name + " found for task " + taskList[i]);
                    } else {
                        //this.log("no creep found for task " + taskList[i]);
                        break;
                    }
                }
            } else {
                task.delete();
            }
        } else {
            Logger.logError('task ' + taskList[i] + ' not found during assignTasks.');
        }
    }
}
