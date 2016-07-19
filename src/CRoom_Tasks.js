'use strict';

let Profiler = require('Profiler');
let Logger = require('Logger');

let CTask = require('CTask');
let CTasks = require('CTasks');

module.exports = function () {
    if ( Room._initDebugTasks !== true ) {
        Room._initDebugTasks = true;
        let methods = ['initTasksStatic', 'initTasksDynamic', 'initTasksDynamic2', 'assignTasks'];
        for (let i in methods) {
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
    for ( let id in this.sources ) {
        let source = this.sources[id];
        if ( (this.controller instanceof StructureController && (this.controller.my || ! this.controller.owner)) && source.memory.isSave ) {
            this.createTask( 'TASK_HARVEST', source, 5, source.getSpotsCnt() );
        }
    }
    if ( this.controller instanceof Structure ) {
        if ( this.controller.my ) {
            let cnt = Math.ceil(this.controllerRefill ? this.controllerRefill.getEnergyPercentage() * 5 : 9);
            let qty = Math.ceil(this.controllerRefill ? this.controllerRefill.getEnergyPercentage() * 40 : 20);
            let prio = this.controller.ticksToDowngrade ? 100 : undefined;
            this.createTask( 'TASK_UPGRADE', this.controller, qty, cnt, prio );
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
    let gatherEnergy = [];
    for (let i in this.creepsHarvester) {
        let creep = this.creepsHarvester[i];
        let task = creep.currentTask;
        if ( task instanceof CTask  ) {
            let source = task.target;
            if ( source instanceof Source && creep.room.name === this.name ) {
                if ( ! (source.link && this.storage instanceof StructureStorage && this.storageLink instanceof StructureLink) ) {
                    let cnt = (source.centerDistance) / 3;
                    this.createTask( 'TASK_GATHER', creep, cnt, 10 );
                    gatherEnergy.push(creep.pos);
                }
            }
        }
    }
    for (let i in this.energy) {
        let energy = this.energy[i];
        let found = false;
        for (let j in gatherEnergy) if (gatherEnergy[j].isEqualTo(energy.pos) ) found = true;
        if( ! found )
            this.createTask( 'TASK_COLLECT', energy, energy.energy );
    }
    if ( this.controller instanceof StructureController ) {
        if ( this.controller.my ) {
            for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_WHITE, secondaryColor: COLOR_YELLOW } }) ) {
                let qty = 0, targets = [];
                for ( let e of f.pos.findInRange(FIND_MY_STRUCTURES, 1, { filter: { structureType: STRUCTURE_EXTENSION } }) ) {
                    qty += e.energyCapacity - e.energy;
                    targets.push(e);
                    e.hasTask = true;
                }
                if ( qty ) this.createTask( 'TASK_DELIVER', f, qty, undefined, undefined, targets );
            }
            for ( let i in this.extensions ) {
                let e = this.extensions[i];
                if ( ! e.hasTask && e.energy < e.energyCapacity ) {
                    this.createTask( 'TASK_DELIVER', e, e.energyCapacity - e.energy );
                }
            }
            for ( let i in this.spawns ) {
                let spawn = this.spawns[i];
                if ( spawn.energy < spawn.energyCapacity ) {
                    this.createTask( 'TASK_DELIVER', spawn, spawn.energyCapacity - spawn.energy );
                }
            }
            if ( this.controllerRefill instanceof StructureContainer ) {
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
            for (let i in this.towers) {
                let tower = this.towers[i];
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
    let cnt = 0;
    let qty = 0;
    for ( let i in this.constructions ) {
        let c = this.constructions[i];
        if ( c instanceof ConstructionSite && c.my ) {
            if ( c.structureType === STRUCTURE_SPAWN ) {
                this.createTask( 'TASK_BUILD', c, c.progressTotal - c.progress, 8, 50 );
            } else if ( c.structureType === STRUCTURE_ROAD || c.structureType === STRUCTURE_WALL || c.structureType === STRUCTURE_RAMPART ) {
                cnt += 0.01;
                qty += c.progressTotal - c.progress;
            } else if ( c.structureType === STRUCTURE_EXTENSION ) {
                cnt += 0.33;
                qty += c.progressTotal - c.progress;
            } else {
                cnt ++;
                qty += c.progressTotal - c.progress;
            }
        }
    }
    let flagName = this.name + "_CONSTRUCT";
    if ( cnt ) {
        if ( ! Game.flags[flagName] ) this.createFlag(this.centerPos, flagName, COLOR_ORANGE, COLOR_ORANGE);
        if ( Game.flags[flagName] ) {
            let t = this.createTask( 'TASK_BUILD', Game.flags[flagName], qty, cnt, 25 );
        } else {
            this.logError("Can't create build default task.");
        }
    } else if ( Game.flags[flagName] ) {
        Game.flags[flagName].remove();
    }

    if ( this.controller instanceof StructureController ) {
        if ( this.controller.my ) {
            let cnt = 0;
            let qty = 0;
            for ( let s of this.find(FIND_STRUCTURES, { filter: function(i) { return i.needsRepair(true); } }) ) {
                if ( ! s instanceof StructureWall && ! s instanceof StructureRampart ) {
                        let task = this.createTask( 'TASK_REPAIR', s, s.hitsMax - s.hits, 15 );
                } else {
                    cnt ++;
                    qty += s.hitsMax - s.hits;
                }
            }
            let flagName = this.name + "_REPAIR";
            if ( cnt ) {
                if ( cnt > 1 ) cnt = 1;
                if ( ! Game.flags[flagName] )
                    this.createFlag(this.centerPos, flagName, COLOR_ORANGE, COLOR_GREY);
                if ( Game.flags[flagName] ) {
                    let task = this.createTask( 'TASK_REPAIR', Game.flags[flagName], qty, cnt );
                } else {
                    this.logError("Can't create build default task.");
                }
            } else if ( Game.flags[flagName] ) {
                Game.flags[flagName].remove();
            }
        }
    }

    let structuresNeedsRepair = this.find(FIND_STRUCTURES, {
        filter: function(i) { return i.needsRepair(); }
    });
    for (let i in structuresNeedsRepair) {
        let structure = structuresNeedsRepair[i];
    }

    if ( this.flag && ( ! this.controller || (this.controller && this.controller.reservation)) ) {
        this.createTask( 'TASK_DELIVER', this.flag, 99999, 99999, 1 );
    }

    for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_YELLOW } }) ) {
        let t = this.createTask( 'TASK_HARVEST_REMOTE', f,
            f.memory.qty ? f.memory.qty : undefined,
            f.memory.cnt ? f.memory.cnt : 1
        );
        f.memory.taskCode = t.code;
    }
    for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_GREY } }) ) {
        f.memory.qty = f.memory.qty ? f.memory.qty : 15;
        f.memory.qty = f.memory.cnt ? f.memory.cnt : 2;
        let t = this.createTask( 'TASK_GATHER_REMOTE', f,
            f.memory.qty,
            f.memory.cnt
        );
        f.memory.taskCode = t.code;
    }
    for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_ORANGE } }) ) {
        let t = this.createTask( 'TASK_BUILD_REMOTE', f,
            f.memory.qty ? f.memory.qty : 5,
            f.memory.cnt ? f.memory.cnt : 1
        );
        f.memory.taskCode = t.code;
    }
    for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_PURPLE } }) ) {
        let t = this.createTask( 'TASK_RESERVE_REMOTE', f,
            f.memory.qty ? f.memory.qty : 2,
            f.memory.cnt ? f.memory.cnt : 1
        );
        f.memory.taskCode = t.code;
    }
    for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_RED, secondaryColor: COLOR_GREY } }) ) {
        let t = this.createTask( 'TASK_GUARD',
            f, f.memory.qty ? f.memory.qty : 10,
            f.memory.cnt ? f.memory.cnt : 1
        );
        f.memory.taskCode = t.code;
    }
    for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_RED } }) ) {
        let t = this.createTask( 'TASK_GUARD_REMOTE', f,
            f.memory.qty ? f.memory.qty : 10,
            f.memory.cnt ? f.memory.cnt : 1
        );
        f.memory.taskCode = t.code;
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

Room.prototype.createTask = function(type, target, qty = 9999, cnt = 9999, prio, targets = []) {
    cnt = Math.ceil(cnt);
    let code = this.getTaskCode(type, target);
    let task = this.getTasks().collection[code];
    if ( task === undefined ) {
        task = new CTask(code, this, type, target, targets, qty, cnt, prio);
        this.getTasks().add(task);
    } else if ( ! task.equals(this, type, target, targets, qty, cnt, prio)) {
        task.update(this, type, target, targets, qty, cnt, prio);
    }
    return task;
}

Room.prototype.assignTasks = function(withHandshake) {
    let tasks = this.getTasks();
    tasks.sort();
    let taskList = tasks.getList();
    for (let code of taskList) { //taskList[i] is the taskCode
        let task = tasks.collection[code];
        if ( task instanceof CTask ) {
            if ( task.valid() ) {
                if (withHandshake) {
                    let assignments = task.assignments;
                    for ( let creepName in assignments ) {
                        let creep = Game.creeps[creepName];
                        if ( ! creep ) {
                            task.assignmentDelete(creepName);
                        } else if ( ! creep.hasTask(task) ) {
                            task.assignmentDelete(creepName);
                            creep.taskDisassign(task);
                        }
                    }
                    //cleanup
                    if ( task.qty <= 0 || task.cnt <= 0 ) {
                        this.log("task " + task.code + " is invalid.");
                        task.delete();
                    }
                }
                while (task.qtyAssigned < task.qty && task.assignmentsCnt < task.cnt ) {
                    let creep = task.assignmentSearch();
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
