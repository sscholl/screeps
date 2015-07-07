// ######### Room #############################################################

Room.prototype.run = function() {
    this.initCreeps();
    if (!this.memory.timer || this.memory.timer <= 0) {
        TIMER_BEGIN_(TIMER_MODULE_ROOM, 'static_init', 'of room ' + this.name)
            this.memory.timer = -1;
            this.initSources();
            this.initExtensions();
            this.memory.timer = 500;
        TIMER_END(TIMER_MODULE_ROOM, 'static_init')
    }

    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'load', 'of room ' + this.name)
        this.loadSources();
        this.loadExtensions();
        this.loadConstructions();
    TIMER_END(TIMER_MODULE_ROOM, 'load')
    

    if (this.memory.timer % 30 == 0) {
        TIMER_BEGIN_(TIMER_MODULE_ROOM, 'dynamic_init', 'of room ' + this.name)
            this.initDynamicSources();
            this.initDynamicConstructions();
        TIMER_END(TIMER_MODULE_ROOM, 'dynamic_init')
    }


    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'actions', 'of room ' + this.name)
        this.sourcesWorkerAction();
        this.collectorWorkerAction();
        this.constructionsWorkerAction();
        this.repairerWorkerAction();
        this.upgraderWorkerAction();

        this.guardAction();

        this.spawnAction();
    TIMER_END(TIMER_MODULE_ROOM, 'actions')

    -- this.memory.timer;
}

// ########### SOURCES SECTION ############################################
Room.prototype.initSources = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initSources', 'of room ' + this.name)
    this.memory.sources         = {};
    this.memory.sourceSpotCount = 0;

    for (var source of this.find(FIND_SOURCES)) {
        this.memory.sources[source.id] = {id: source.id};
        source.setMemory();
        source.initSpots();
    }

    this.memory.hostileSpawnIds = [];
    this.memory.hostileSpawns = this.find(FIND_HOSTILE_STRUCTURES);
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        this.memory.hostileSpawnIds[hostileSpawnNr] = this.memory.hostileSpawns[hostileSpawnNr].id;
    }
    this.initDynamicSources();
    TIMER_END(TIMER_MODULE_ROOM, 'initSources')
}
Room.prototype.loadSources = function() {
    this.sources = {};
    for (var id in this.memory.sources) {
        this.sources[id] = Game.getObjectById(id);
        this.sources[id].setMemory();
    }

    this.hostileSpawns = [];
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        var hostileSpawnId = this.memory.hostileSpawns[hostileSpawnNr].id;
        this.hostileSpawns[hostileSpawnNr] = Game.getObjectById(hostileSpawnId);
    }
}
Room.prototype.initDynamicSources = function() {
    for (var id in this.sources) {
        var source = this.sources[id];

        source.memory.isSave = (
                this.creepsHealer.length >= 2 && this.creepsRanger.length >= 2
            ) || !source.memory.hasHostileSpawn;
    }
}
Room.prototype.sourcesWorkerAction = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'sourcesWorkerAction', 'of room ' + this.name)
    for (var id in this.sources) {
        var source = this.sources[id];


        if (source.memory.isSave) {
            for (var i in source.memory.spots) {
                var sourceSpot = source.memory.spots[i];

                var creep = Game.creeps[sourceSpot.creepName];
                // if creep not exists or has a wrong state, search a new harvester
                if (   !creep 
                    || creep.memory.harvesterSourceId != source.id
                    || creep.memory.phase != 'harvest'
                ) {
                    if (creep) {
                        delete sourceSpot.harvesterSourceId;
                    }
                    creep = source.pos.findClosestSearchingDefaultWorker();
                    if (creep) {
                        creep.memory.role = 'harvester';
                        creep.memory.harvesterSourceId = source.id;
                        creep.memory.phase = 'harvest';
                        sourceSpot.creepName = creep.name;
                    }
                }
            }
        }
    }
    TIMER_END(TIMER_MODULE_ROOM, 'sourcesWorkerAction')
}

// ########### ENERGY SECTION ###########################################
Room.prototype.collectorWorkerAction = function() {
    var collectorCount = 2;

    var creeps = this.find(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.role == 'collector'
            }
        }
    );
    var oldCollectorCount = creeps.length;

    if (oldCollectorCount < collectorCount) {
        creeps = this.findSearchingDefaultWorker();
        for(var i = oldCollectorCount; i < collectorCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'collector';
                creeps[i].memory.phase = 'collect';
                LOG_DETAIL_THIS("add a collector")
            }
        }
    }
}

// ########### CONTROLLER SECTION ##########################################
Room.prototype.upgraderWorkerAction = function() {
    var upgraderCount = 8;

    var creeps = this.find(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.role == 'upgrader'
            }
        }
    );
    var oldUpgraderCount = creeps.length;

    if (oldUpgraderCount < upgraderCount) {
        creeps = this.findSearchingDefaultWorker();
        for(var i = oldUpgraderCount; i < upgraderCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'upgrader';
                creeps[i].memory.phase = 'upgrade';
                LOG_DETAIL_THIS("add a upgrader " + creeps[i].name)
            }
        }
    }
}

// ########### EXTENSION SECTION #############################################
Room.prototype.initExtensions = function() {
    this.memory.extensionIds = [];

    this.extensions = this.find(
        FIND_MY_STRUCTURES, 
        {filter: {structureType: STRUCTURE_EXTENSION}}
    );
    for (var extensionNr in this.extensions)
        this.memory.extensionIds[extensionNr] = this.extensions[extensionNr].id;
}
Room.prototype.loadExtensions = function() {
    this.extensions = [];
    for (var extensionNr in this.memory.extensionIds) {
        var extensionId = this.memory.extensionIds[extensionNr];
        this.extensions[extensionNr] = Game.getObjectById(extensionId);
    }
}

// ########### CONSTRUCTION SECTION ###########################################
Room.prototype.initDynamicConstructions = function() {
    this.memory.constructionIds = [];

    this.constructions = this.find(FIND_CONSTRUCTION_SITES);
    for (var constructionNr in this.constructions)
        this.memory.constructionIds[constructionNr] = this.constructions[constructionNr].id;
}
Room.prototype.loadConstructions = function() {
    this.constructions = [];
    for (var constructionNr in this.memory.constructions) {
        var constructionID = this.memory.constructionIds[constructionNr];
        this.constructions[constructionNr] = Game.getObjectById(constructionId);
    }
}
Room.prototype.constructionsWorkerAction = function() {
    var builderCount = 0.0;
    for (var constructionNr in this.constructions) {
        var construction = this.constructions[constructionNr];

        switch (construction.structureType) {
            case STRUCTURE_ROAD:
                builderCount += 0.2;
                break; 
            case STRUCTURE_EXTENSION:
                ++ builderCount;
                break;
            default: ++ builderCount;
                break;
        }
    }

    var creeps = this.find(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.role == 'builder'
            }
        }
    );
    var oldBuildersCount = creeps.length;

    if (oldBuildersCount < builderCount) {
        creeps = this.findSearchingDefaultWorker();
        for(var i = oldBuildersCount; i < builderCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'builder';
                creeps[i].memory.phase = 'build';
                LOG_DETAIL_THIS("add a builder")
            }
        }
    }
}
Room.prototype.repairerWorkerAction = function() {
    var repairerCount = 3;

    var creeps = this.find(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.role == 'repairer'
            }
        }
    );
    var oldRepairersCount = creeps.length;

    if (oldRepairersCount < repairerCount) {
        creeps = this.findSearchingDefaultWorker();
        for(var i = oldRepairersCount; i < repairerCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'repairer';
                creeps[i].memory.phase = 'repair';
                LOG_DETAIL_THIS("add a repairer")
            }
        }
    }
}

// ########### CREEPS SECTION #############################################
Room.prototype.initCreeps = function() {
    this.creepsDefault = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'default'}}});
    this.creepsWorker = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'worker'}}});
    this.creepsRanger = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'ranger'}}});
    this.creepsHealer = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'healer'}}});
    //this.creeps = this.find(FIND_MY_CREEPS);
    this.creeps = this.creepsDefault.concat(this.creepsWorker, this.creepsRanger, this.creepsHealer);
}
Room.prototype.guardAction = function() {
    for (rangerNr in this.creepsRanger) {
        var creep = this.creepsRanger[rangerNr];
        //if (!Number.isInteger(creep.memory.hostileSpawnNr)) 
            creep.memory.hostileSpawnNr = rangerNr % this.hostileSpawns.length;
    }
}
Room.prototype.creepsRequired = function() {
    return this.memory.sourceSpotCount * 1.2;
}
Room.prototype.creepsRequiredAllWork = function() {
    return this.memory.sourceSpotCount + Object.keys(this.memory.sources).length + 1 + 2; //add upgrader, builder, repairer, collector
}

// ########### SPAWN SECTION ############################################
Room.prototype.spawnAction = function() {
    for (var spawnId in this.spawns) {
        var spawn = this.spawns[spawnId];

        if (spawn.energy >= 0 || this.creepsDefault.length < this.creepsRequired()) {
            var bodyParts;
            var body;
            if (//this.hostileSpawns.length <= 2 
                this.creepsHealer.length < this.hostileSpawns.length * 2
                && this.creepsRanger.length >= 4
                && this.creepsDefault.length >= this.creepsRequiredAllWork()
                && this.extensions.length >= 20
            ) {
                bodyParts = [
                    MOVE, MOVE, MOVE,  //4 * 50 = 200
                    HEAL, HEAL, HEAL, HEAL, //4 * 200 = 800
                    MOVE
                ];
                body = "healer";
            } else if (//this.hostileSpawns.length <= 2 
                this.creepsRanger.length < this.hostileSpawns.length * 4
                && this.creepsDefault.length >= this.creepsRequiredAllWork() 
                && this.extensions.length >= 40
            ) {
                bodyParts = [
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
                    TOUGH, TOUGH, TOUGH, TOUGH, 
                    // 9 * 10 = 90
                    MOVE, MOVE, MOVE, MOVE, MOVE,  
                    MOVE, MOVE, MOVE, MOVE,   //9 * 50 = 450
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK,
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, //11 * 150 = 1650
                    MOVE // 50
                ]; // sum = 2240
                body = "ranger";
            } else if (//this.hostileSpawns.length <= 2 
                this.creepsRanger.length < this.hostileSpawns.length * 4
                && this.creepsDefault.length >= this.creepsRequiredAllWork() 
                && this.extensions.length >= 30
            ) {
                bodyParts = [
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, 
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, // 13 * 10 = 130
                    MOVE, MOVE, MOVE, MOVE, MOVE,  
                    MOVE, MOVE, MOVE, MOVE,   //9 * 50 = 450
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, 
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, //7 * 150 = 1150
                    MOVE
                ]; // sum = 1630
                body = "ranger";
            } else if (this.hostileSpawns.length <= 2 
                && this.creepsRanger.length < this.hostileSpawns.length * 4
                && this.creepsDefault.length >= this.creepsRequiredAllWork() 
                && this.extensions.length >= 20
            ) {
                bodyParts = [
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH,
                    MOVE, MOVE, MOVE, MOVE, MOVE,  //5 * 50 = 250
                    RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, //5 * 150 = 750
                    MOVE
                ];
                body = "ranger";
            } else if (this.creepsDefault.length < this.creepsRequiredAllWork() * 2) { // need additional workers

                if (false && 
                    this.creepsDefault.length >= this.creepsRequired() / 1
                    && this.creepsWorker.length < this.spawns.length
                    && this.extensions.length >= 14
                ) {
                    bodyParts = [
                        WORK, WORK, WORK, WORK, WORK, 
                        CARRY, CARRY, CARRY, CARRY, CARRY,
                        MOVE, MOVE, MOVE, MOVE, MOVE
                    ];
                    body = "worker";
                } else if (this.creepsDefault.length >= this.creepsRequired() / 1 && this.extensions.length >= 7) {
                    bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
                    body = "default";
                } else if (this.creepsDefault.length >= this.creepsRequired() / 1.5 && this.extensions.length >= 6) {
                    bodyParts = [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
                    body = "default";
                } else if (this.creepsDefault.length >= this.creepsRequired() / 2 && this.extensions.length >= 2) {
                    bodyParts = [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
                    body = "default";
                } else if (this.creepsDefault.length >= this.creepsRequired() / 3) {
                    bodyParts = [WORK, CARRY, MOVE, MOVE];
                    body = "default";
                } else {
                    bodyParts = [WORK, CARRY, MOVE];
                    body = "default";
                }

            } else {
                this.logCompact("no creep is required");
            }

            var result = spawn.createCreep(bodyParts);
            if(_.isString(result)) {
                this.logCompact('Spawning: ' + result + " with Body: " + bodyParts + " / new sum: " + (this.creeps.length + 1));
                if (body == "default") Memory.creeps[result].role = 'harvester';
                if (body == "ranger") Memory.creeps[result].role = 'guard';
                if (body == "healer") Memory.creeps[result].role = 'healer';
                Memory.creeps[result].body = body;
            } else {
                //if (result != ERR_BUSY)
                //    console.log('Spawn error: ' + result);
            }
        }
    }
}

// ########### HOSTILE SECTION ###########################################
Room.prototype.getHostileCreeps = function() {
    if (this.hostileCreeps == undefined) {
        this.hostileCreeps = this.find(FIND_HOSTILE_CREEPS);
    }
    return this.hostileCreeps;
}
// ########### OTHER SECTION ############################################
Room.prototype.logCompact = function(message) {
    logCompact('[' + this.name + "] " + message);
}
Room.prototype.logDetail = function(message) {
    logDetail('[' + this.name + "] " + message);
}
Room.prototype.logError = function(message) {
    logError('[' + this.name + "] " + message);
}