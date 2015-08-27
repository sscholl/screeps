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
        this.energy = this.findDroppedEnergy();
    TIMER_END(TIMER_MODULE_ROOM, 'load')
    

    if (this.memory.timer % 15 == 0) {
        TIMER_BEGIN_(TIMER_MODULE_ROOM, 'dynamic_init', 'of room ' + this.name)
            this.initDynamicSources();
            this.initDynamicConstructions();
            this.initDynamicStructures();
        TIMER_END(TIMER_MODULE_ROOM, 'dynamic_init')
    }

    if (this.memory.timer === 600) {
        this.initTasksStatic();
    } else if (this.memory.timer % 30 == 0) {
        this.initTasksDynamic2();
    } else if (this.memory.timer % 5 == 0) {
        this.initTasksDynamic();
    }

    TIMER_BEGIN_(TIMER_MODULE_ROOM, 'actions', 'of room ' + this.name)
        var withHandshake = this.memory.timer % 15 == 0;
        this.assignTasks(withHandshake);
this.repairerWorkerAction();
        this.structuresAction(); // LINK action
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
        if (!this.memory.sources[source.id])
            this.memory.sources[source.id] = {id: source.id};
        source.getSpotsCnt();
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

        source.getMemory().isSave = (
                this.creepsHealer.length >= 4  * this.hostileSpawns.length
                && this.creepsRanger.length >= 3 * this.hostileSpawns.length
            ) || !source.getMemory().hasHostileSpawn;
        if (source.getMemory().isSave) {
            this.memory.sourcesSaveCount ++;
            this.memory.sourceSpotCount += source.getSpotsCnt();
        }

        var link = source.pos.findInRangeLink(2);
        if (link[0] != undefined) source.getMemory().linkId = link[0].id;
    }
};

// ########### STRUCTURES SECTION #############################################
Room.prototype.initDynamicStructures = function() {
    this.memory.extensionIds = [];

    this.extensions = this.find(
        FIND_MY_STRUCTURES, 
        {filter: {structureType: STRUCTURE_EXTENSION}}
    );
    for (var extensionNr in this.extensions)
        this.memory.extensionIds[extensionNr] = this.extensions[extensionNr].id;

    var storages = this.controller.pos.findInRange(
        FIND_MY_STRUCTURES, 2, {filter: {structureType: STRUCTURE_STORAGE}}
    );
    if (storages[0] != undefined) this.memory.controllerStorageId = storages[0].id;

    if (this.getStorage() instanceof Structure) {
        var links = this.getStorage().pos.findInRangeLink(2);
        if (links[0] != undefined) this.memory.storageLinkId = links[0].id;
    }
}
Room.prototype.loadStructures = function() {
    this.extensions = [];
    for (var extensionNr in this.memory.extensionIds) {
        var extensionId = this.memory.extensionIds[extensionNr];
        this.extensions[extensionNr] = Game.getObjectById(extensionId);
    }
    this.storageLink = Game.getObjectById(this.memory.storageLinkId);
    this.controllerStorage = Game.getObjectById(this.memory.controllerStorageId);

};
Room.prototype.structuresAction = function() {
    for (var i in this.sources) {
        var linkId = this.sources[i].getMemory().linkId;
        if (linkId) {
            var link = Game.getObjectById(linkId);
            if (link.isFull() && this.storageLink.isEmpty()) {
                link.transferEnergy(this.storageLink);
                break; // do not transfer from 2 links at the same time
            }
        }
    }
};
Room.prototype.getStorage = function() {
    if (this.storage === undefined) {
        var storages = this.find(FIND_MY_STRUCTURES, 
            {filter: {structureType: STRUCTURE_STORAGE}}
        );
        if (storages[0] != undefined) {
            this.storage = storages[0];
        } else {
            this.storage = false;
        }
    }
    return this.storage;
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
Room.prototype.repairerWorkerAction = function() {
LOG_DEBUG("do not need repairer")
return;

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
        if (this.creepsHarvester.length < 1) {
            for (var id in this.sources) {
                var source = this.sources[id];
                if (source.getMemory().isSave)
                    if (source.getMemory().creepName) ++ this.defaultHarvesterCount;
                    else this.defaultHarvesterCount += source.getSpotsCnt();
            }
        }
    }
    return this.defaultHarvesterCount;
}
Room.prototype.getDefaultUpgraderCount = function() {
    if (this.controllerStorage instanceof Structure) return 0;
    else return 1;
}
Room.prototype.creepsRequired = function() {
    return this.getDefaultHarvesterCount();
}
Room.prototype.creepsRequiredAllWork = function() {
    return (2*this.memory.sourcesSaveCount) + this.getDefaultHarvesterCount() + this.getDefaultUpgraderCount(); //harvester, upgrader, repairer
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
        } else if ( this.creepsHealer.length < 2
            && this.extensions.length >= 20
        ) {
            spawn.spawnHealer();
        } else if ( this.creepsRanger.length < 2
            && this.extensions.length >= 20
        ) {
            spawn.spawnRanger();
        } else if ( this.controllerStorage instanceof Structure
            && this.creepsUpgrader.length < 1
            && this.extensions.length >= 20
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

Room.prototype.getUnsavePostions = function() {
    if (this.poss === undefined) {
        this.poss = [];
        var creeps = this.getHostileCreeps();
        for (var i in creeps) {
            var creep = creeps[i];
            this.poss = this.poss.concat(creep.pos.getInRangePositions(3));
        }
    }
    return this.poss;
}

Room.prototype.hasCreepEmpty = function(bodyType, setNoCreep) {
    if (this.noCreepEmpty === undefined)
        this.noCreepEmpty = [];
    if (setNoCreep) 
        this.noCreepEmpty[bodyType] = true;
    return this.noCreepEmpty[bodyType] === undefined;
}
Room.prototype.hasCreepFull = function(bodyType, setNoCreep) {
    if (this.noCreepFull === undefined)
        this.noCreepFull = [];
    if (setNoCreep) 
        this.noCreepFull[bodyType] = true;
    return this.noCreepFull[bodyType] === undefined;
}