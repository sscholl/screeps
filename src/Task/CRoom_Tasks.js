// ########### Room Tasks ############################################
Room.prototype.getTasks = function() {
    if (this.memory.tasks === undefined) {
        this.memory.tasks = new CTasks();
    }
    if (!(this.memory.tasks instanceof CTasks))
        this.memory.tasks.__proto__ = CTasks.prototype;
    return this.memory.tasks;
}

Room.prototype.initTasksStatic = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initTasksStatic', 'of room ' + this.name)
    for (var id in this.sources) {
        var source = this.sources[id];
        if (source.getMemory().isSave) {
            this.createTask(
                    TASK_HARVEST, 
                    source.id, 
                    source.pos, 
                    source.getSpotsCnt()
            );
        }
    }
    if (this.controller instanceof Structure && this.controller.my) {
        this.createTask(
            TASK_UPGRADE,
            this.controller.id, 
            this.controller.pos, 
            this.controller.pos.getSpotsCnt()
        );
    } else {
        if (!this.defaultSpawn) {
            
        }
    }
    TIMER_END(TIMER_MODULE_ROOM, 'initTasks')
}

Room.prototype.initTasksDynamic = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initTasksDynamic', 'of room ' + this.name)

    if (this.name === 'W6N13') {
            /*var exits = Game.map.describeExits('W5N13');
            var exitDirW5N13 = false;
            for (var i in exits) {
                if (exits[i] === 'W5N13') exitDirW5N13 = i;
            }*/
            this.createTask(
                TASK_MOVE, 
                'W5N13', 
                new RoomPosition(49, 24, this.name).findClosestByRange(Game.map.findExitCached(this.name, 'W5N13')), 
                1,
                true,
                [BODY_DEFAULT]
            );
    } else {
        if (!this.defaultSpawn) {
            this.createTask(
                TASK_MOVE, 
                'W6N13', 
                new RoomPosition(1, 24, this.name).findClosestByRange(Game.map.findExitCached(this.name, 'W6N13')), 
                1000,
                false,
                [BODY_DEFAULT]
            );
        }
    }

    for (var i in this.energy) {
        var energy = this.energy[i];
        this.createTask(
                TASK_COLLECT, 
                energy.id, 
                energy.pos, 
                energy.energy
        );
    }
    for (var i in this.creepsHarvester) {
        var creep = this.creepsHarvester[i];
        var task = creep.getCurrentTask();
        if ( task instanceof CTask ) {
            var source = task.getTarget();
            if ( source !== null && !source.getMemory().linkId ) {
                this.createTask(
                        TASK_GATHER, 
                        creep.id, 
                        creep.pos, 
                        2
                );
            }
        }
    }
    if (this.controller instanceof Structure) {
        for (var i in this.extensions) {
            var ext = this.extensions[i];
            if (ext.energy < ext.energyCapacity) {
                this.createTask(
                        TASK_DELIVER, 
                        ext.id, 
                        ext.pos, 
                        ext.energyCapacity - ext.energy
                );
            }
        }
        for (var i in this.spawns) {
            var spawn = this.spawns[i];
            if (spawn.energy < spawn.energyCapacity) {
                this.createTask(
                        TASK_DELIVER, 
                        spawn.id, 
                        spawn.pos, 
                        spawn.energyCapacity - spawn.energy
                );
            }
        }
        if (this.storage instanceof Structure) {
            if (this.storage.store.energy < this.storage.storeCapacity) {
                this.createTask(
                    TASK_DELIVER, 
                    this.storage.id, 
                    this.storage.pos, 
                    this.storage.storeCapacity - this.storage.store.energy
                );
                if (this.storageLink instanceof Structure && this.storageLink.energy >= 0)
                    this.createTask(
                        TASK_FILLSTORAGE, 
                        this.storageLink.id, 
                        this.storageLink.pos, 
                        1
                    );
            }
        }
    }
    TIMER_END(TIMER_MODULE_ROOM, 'initTasksDynamic')
}



Room.prototype.initTasksDynamic2 = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initTasksDynamic2', 'of room ' + this.name)
    if (this.controller instanceof Structure) {
        for (var i in this.constructions) {
            var construction = this.constructions[i];
            if (construction instanceof ConstructionSite) {
                this.createTask(
                        TASK_BUILD, 
                        construction.id, 
                        construction.pos, 
                        2 //construction.pos.getSpotsCnt()
                );
            }
        }
    }
    TIMER_END(TIMER_MODULE_ROOM, 'initTasksDynamic2')
}

Room.prototype.createTask = function(type, targetId, pos, qty, energySource, bodyTypes) {
    //TIMER_BEGIN_(TIMER_MODULE_ROOM, 'createTask', 'in room ' + this.nam
    var task = new CTask(type, targetId, pos, qty, energySource, bodyTypes);
    this.getTasks().add(task);
    //TIMER_END(TIMER_MODULE_ROOM, 'createTask')
}

Room.prototype.assignTasks = function(withHandshake) {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'assignTasks', 'of room ' + this.name)
    var tasks = this.getTasks();
    tasks.sort();
    var taskList = tasks.getList();
    for (var i in taskList) { //taskList[i] is the taskCode
        var task = tasks.get(taskList[i]);
        //TIMER_BEGIN_(TIMER_MODULE_ROOM, 'assignTask', task.getCode())
        var assignments = task.getAssignments();
        if (withHandshake) {
            for (var creepName in assignments) {
                var creep = Game.creeps[creepName];
                if ( !creep ) {
                    task.assignmentDelete(creepName);
                } else if (!creep.hasTask(task)) {
                    task.assignmentDelete(creepName);
                    creep.taskDisassign(task);
                }
            }
        }
        while (task.getQtyAssigned() < task.getQty()) {
            var creep = task.assignmentSearch();
            if (creep instanceof Creep) {
                task.assignmentCreate(creep);
                creep.taskAssign(task);
            } else {
                //LOG_DEBUG("no creep found")
                break;
            }
        }
        //TIMER_END(TIMER_MODULE_ROOM, 'assignTask')
    }

    TIMER_END(TIMER_MODULE_ROOM, 'assignTasks')
}