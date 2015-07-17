#include "CRoom_Find.js"
#include "CRoom_Tasks.js"

// ######### Room #############################################################

Room.prototype.run = function() {
    this.initCreeps();
    if (!this.memory.timer || this.memory.timer <= 0) {
        TIMER_BEGIN_(TIMER_MODULE_ROOM, 'static_init', 'of room ' + this.name)
            this.memory.timer = -1;
            this.initSources();
            this.memory.timer = 600;
        TIMER_END(TIMER_MODULE_ROOM, 'static_init')
    }

    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'load', 'of room ' + this.name)
        this.loadSources();
        this.loadStructures();
        this.loadConstructions();
    TIMER_END(TIMER_MODULE_ROOM, 'load')
    

    if (this.memory.timer % 30 == 0) {
        TIMER_BEGIN_(TIMER_MODULE_ROOM, 'dynamic_init', 'of room ' + this.name)
            this.initDynamicSources();
            this.initDynamicConstructions();
            this.initDynamicStructures();
        TIMER_END(TIMER_MODULE_ROOM, 'dynamic_init')
    }

    this.initTasks();

    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'actions', 'of room ' + this.name)
        this.structuresAction();

        this.sourcesWorkerAction();
        this.collectorWorkerAction();
        this.constructionsWorkerAction();
        this.upgraderWorkerAction();
        this.repairerWorkerAction();

        this.guardAction();

        this.spawnAction();
    TIMER_END(TIMER_MODULE_ROOM, 'actions')

    -- this.memory.timer;
}

// ########### SOURCES SECTION ############################################
Room.prototype.initSources = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'initSources', 'of room ' + this.name)
    if (!this.memory.sources)
        this.memory.sources = {};

    for (var source of this.find(FIND_SOURCES)) {
        if (!this.memory.sources[source.id]) {
            this.memory.sources[source.id] = {};
            this.memory.sources[source.id].id = source.id;
        }
        source.setMemory();
        source.initSpots();
    }

    this.memory.hostileSpawnIds = [];
    this.memory.hostileSpawns = this.find(FIND_HOSTILE_STRUCTURES);
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        this.memory.hostileSpawnIds[hostileSpawnNr] = this.memory.hostileSpawns[hostileSpawnNr].id;
    }
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
    this.memory.sourcesSaveCount = 0;
    this.memory.sourceSpotCount = 0;
    for (var id in this.sources) {
        var source = this.sources[id];

        source.memory.isSave = (
                this.creepsHealer.length >= 4  * this.hostileSpawns.length
                && this.creepsRanger.length >= 3 * this.hostileSpawns.length
            ) || !source.memory.hasHostileSpawn;
        if (source.memory.isSave) {
            this.memory.sourcesSaveCount ++;
            this.memory.sourceSpotCount += source.memory.spots.length;
        }

        var link = source.pos.findInRangeLink(2);
        if (link[0] != undefined) source.memory.linkId = link[0].id;
    }
}
Room.prototype.sourcesWorkerAction = function() {
    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'sourcesWorkerAction', 'of room ' + this.name)
    for (var id in this.sources) {
        var source = this.sources[id];

        if (source.memory.isSave) {
            var creep = Game.creeps[source.memory.creepName];
            if (   !creep 
                || creep.memory.harvesterSourceId != source.id
                || creep.memory.phase != PHASE_HARVEST
            ) {
                if (!creep) {
                    delete source.memory.creepName;
                }
                creep = source.pos.findClosestSearchingHarvester();
                if (creep) {
                    creep.memory.harvesterSourceId = source.id;
                    creep.memory.phase = PHASE_HARVEST;
                    source.memory.creepName = creep.name;
                } else {
                    for (var i in source.memory.spots) {
                        var sourceSpot = source.memory.spots[i];
                        creep = Game.creeps[sourceSpot.creepName];
                        // if creep not exists or has a wrong state, search a new harvester
                        if (   !creep 
                            || creep.memory.harvesterSourceId != source.id
                            || creep.memory.phase != PHASE_HARVEST
                        ) {
                            if (creep) {
                                delete sourceSpot.creepName;
                            }
                            creep = source.pos.findClosestSearchingDefaultWorker();
                            if (creep) {
                                creep.memory.role = 'harvester';
                                creep.memory.harvesterSourceId = source.id;
                                creep.memory.phase = PHASE_HARVEST;
                                sourceSpot.creepName = creep.name;
                                this.logError("add a new default harvester for sourceSpot " + source.pos.x + " " + source.pos.y);
                            }
                        }
                    }
                }
            }
        }
    }
    TIMER_END(TIMER_MODULE_ROOM, 'sourcesWorkerAction')
}

// ########### ENERGY SECTION ###########################################
Room.prototype.collectorWorkerAction = function() {
    this.energy = this.findDroppedEnergy();

    this.energyAmount = this.creepsHarvester.length;
    for (var i in this.energy) {
        var energy = this.energy[i];
        this.energyAmount += energy.energy;
    }


    var collectorCount = Math.round(this.energyAmount / 100) + 1;
    if (collectorCount > this.creepsDefault.length / 2)
        collectorCount = this.creepsDefault.length / 2;

    var creeps = this.find(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.role == 'collector'
            }
        }
    );
    var oldCollectorCount = creeps.length;

    if (oldCollectorCount < collectorCount) {
        creeps = this.findSearchingDefaultWorkerEmpty();
        for(var i = 0; i < collectorCount - oldCollectorCount; ++ i) {
            if (creeps[i]) {
                creeps[i].changeCollector();
            } else {
                break;
            }
        }
    }
}

// ########### CONTROLLER SECTION ##########################################
Room.prototype.upgraderWorkerAction = function() {

    var creep = this.controller.pos.findClosestSearchingUpgrader();
    if (creep) {
        creep.memory.phase = PHASE_UPGRADE;
    }

    var upgraderCount = this.getDefaultUpgraderCount() - this.creepsUpgrader.length; //replace 5 with controller spots
    var creeps = this.find(FIND_MY_CREEPS, 
        { filter:
            function (creep) {
                return creep.memory.role == 'upgrader'
            }
        }
    );
    var oldUpgraderCount = creeps.length;

    if (oldUpgraderCount < upgraderCount) {
        creeps = this.findSearchingDefaultWorkerFull();
        if (creeps.length == 0) creeps = this.findSearchingDefaultWorker();
        for(var i = 0; i < upgraderCount - oldUpgraderCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = BODY_UPGRADER;
                creeps[i].memory.phase = PHASE_UPGRADE;
                LOG_DETAIL_THIS("add a upgrader " + creeps[i].name)
            }
        }
    }
}

// ########### EXTENSION SECTION #############################################
Room.prototype.initDynamicStructures = function() {
    this.memory.extensionIds = [];

    this.extensions = this.find(
        FIND_MY_STRUCTURES, 
        {filter: {structureType: STRUCTURE_EXTENSION}}
    );
    for (var extensionNr in this.extensions)
        this.memory.extensionIds[extensionNr] = this.extensions[extensionNr].id;

    var link = this.controller.pos.findInRangeLink(2);
    if (link[0] != undefined) this.memory.controllerLinkId = link[0].id;
}
Room.prototype.loadStructures = function() {
    this.extensions = [];
    for (var extensionNr in this.memory.extensionIds) {
        var extensionId = this.memory.extensionIds[extensionNr];
        this.extensions[extensionNr] = Game.getObjectById(extensionId);
    }
    this.controllerLink = Game.getObjectById(this.memory.controllerLinkId);
}
Room.prototype.structuresAction = function() {
    for (var i in this.sources) {
        var linkId = this.sources[i].memory.linkId;
        if (linkId) {
            var link = Game.getObjectById(linkId);
            if (link.isFull() && this.controllerLink.isEmpty()) {
                link.transferEnergy(this.controllerLink);
                break; // do not transfer from 2 links at the same time
            }
        }
    }
}

// ########### CONSTRUCTION SECTION ###########################################
Room.prototype.initDynamicConstructions = function() {
    this.memory.constructionIds = [];

    this.constructions = this.find(FIND_CONSTRUCTION_SITES);
    for (var i in this.constructions)
        this.memory.constructionIds[i] = this.constructions[i].id;
}
Room.prototype.loadConstructions = function() {
    this.constructions = [];
    for (var i in this.memory.constructionIds) {
        this.constructions[i] = (Game.getObjectById(this.memory.constructionIds[i]));
    }
}
Room.prototype.constructionsWorkerAction = function() {
    var builderCount = 0.0;
    for (var i in this.constructions) {
        var construction = this.constructions[i];
        if (construction) {
            switch (construction.structureType) {
                case STRUCTURE_ROAD:      builderCount += 0.2;
                    break; 
                case STRUCTURE_EXTENSION: builderCount += 5;
                    break;
                default:                  ++ builderCount;
                    break;
            }
        }
    }

    var creeps = this.find(FIND_MY_CREEPS, 
        { filter: function (creep) { return creep.memory.role == 'builder' } }
    );
    var oldBuildersCount = creeps.length;

    if (oldBuildersCount < builderCount) {
        creeps = this.findSearchingDefaultWorkerFull();
        if (creeps.length == 0) creeps = this.findSearchingDefaultWorker();
        for(var i = 0; i < builderCount - oldBuildersCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'builder';
                creeps[i].memory.phase = 'build';
                LOG_DETAIL_THIS("add a builder " + creeps[i].name)
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
        creeps = this.findSearchingDefaultWorkerFull();
        if (creeps.length == 0) creeps = this.findSearchingDefaultWorker();
        for(var i = 0; i < repairerCount - oldRepairersCount; ++ i) {
            if (creeps[i]) {
                creeps[i].memory.role = 'repairer';
                creeps[i].memory.phase = 'repair';
                LOG_DETAIL_THIS("add a repairer " + creeps[i].name)
            }
        }
    }
}

// ########### CREEPS SECTION #############################################
Room.prototype.initCreeps = function() {
    this.creepsDefault = this.find(FIND_MY_CREEPS, {filter: {memory: {body: BODY_DEFAULT}}});
    this.creepsHarvester = this.find(FIND_MY_CREEPS, {filter: {memory: {body: BODY_HARVESTER}}});
    this.creepsUpgrader = this.find(FIND_MY_CREEPS, {filter: {memory: {body: BODY_UPGRADER}}});
    this.creepsRanger = this.find(FIND_MY_CREEPS, {filter: {memory: {body: BODY_RANGER}}});
    this.creepsHealer = this.find(FIND_MY_CREEPS, {filter: {memory: {body: BODY_HEALER}}});
    //this.creeps = this.find(FIND_MY_CREEPS);
    this.creeps = this.creepsDefault.concat(this.creepsHarvester, this.creepsUpgrader, this.creepsRanger, this.creepsHealer);
}
Room.prototype.guardAction = function() {
    for (rangerNr in this.creepsRanger) {
        var creep = this.creepsRanger[rangerNr];
        //if (!Number.isInteger(creep.memory.hostileSpawnNr)) 
            creep.memory.hostileSpawnNr = rangerNr % this.hostileSpawns.length;
    }
}
Room.prototype.getDefaultHarvesterCount = function() {
    if (this.defaultHarvesterCount == undefined) {
        this.defaultHarvesterCount = 0;
        for (var id in this.sources) {
            var source = this.sources[id];
            if (source.memory.isSave)
                if (source.memory.creepName) ++ this.defaultHarvesterCount;
                else this.defaultHarvesterCount += source.memory.spots.length;
        }
    }
    return this.defaultHarvesterCount;
}
Room.prototype.getDefaultUpgraderCount = function() {
    return 1;
}
Room.prototype.creepsRequired = function() {
    return this.getDefaultHarvesterCount();
}
Room.prototype.creepsRequiredAllWork = function() {
    return this.getDefaultHarvesterCount() + this.getDefaultUpgraderCount() + 2 + 1; //harvester, upgrader, repairer
}



// ########### SPAWN SECTION ############################################
Room.prototype.spawnAction = function() {
    for (var spawnId in this.spawns) {
        var spawn = this.spawns[spawnId];

        var bodyParts;
        var body;
        if ( this.creepsDefault.length > this.creepsRequired()
            && this.creepsHarvester.length < this.memory.sourcesSaveCount
            && this.extensions.length >= 5
        ) {
            spawn.spawnHarvester();
        } else if (this.creepsDefault.length < this.creepsRequiredAllWork()) {
            spawn.spawnDefault();
        } else if ( this.creepsHealer.length < this.hostileSpawns.length * 2
            && (this.creepsHealer.length < 2 || this.creepsRanger.length > this.hostileSpawns.length)
        ) {
            spawn.spawnHealer();
        } else if ( this.creepsRanger.length < this.hostileSpawns.length * 4
            && this.extensions.length >= 20
        ) {
            spawn.spawnRanger();
        } else if ( this.controllerLink
            && this.creepsUpgrader.length < this.controller.level - 4
            && this.extensions.length >= 23
        ) {
            spawn.spawnUpgrader();
        } else {
            this.logCompact('SPAWN: no creep is required');
        }
        break; // todo: multispawn problem quickfix
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