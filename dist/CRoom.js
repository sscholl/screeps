"use strict";

var Profiler = require('Profiler');
var Logger = require('Logger');

var CTask = require('CTask');

// ######### Room #############################################################

Room.prototype.run = function () {

    this.spawns = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } });
    if (this.spawns.length > 0) {
        this.defaultSpawn = this.spawns[0];
    }
    this.resetFind();
    this.initCreeps();
    if (!this.memory.timer || this.memory.timer % 600 === 0) {
        this.memory.timer = -1;
        this.initSources();
        this.memory.timer = 600;
    }

    this.loadSources();
    this.loadStructures();
    this.loadConstructions();
    this.energy = this.findDroppedEnergy();

    if (this.memory.timer % 1 === 0) {
        this.initDynamicSources();
        this.initDynamicConstructions();
        this.initDynamicStructures();
    }

    if (this.memory.timer % 600 === 0) {
        this.initTasksStatic();
    } else if (this.memory.timer % 15 == 0) {
        this.initTasksDynamic2();
    } else if (this.memory.timer % 1 == 0) {
        this.initTasksDynamic();
    }

    var withHandshake = this.memory.timer % 15 == 0;
    this.assignTasks(withHandshake);
    this.linkAction();
    this.spawnAction();

    --this.memory.timer;
};

// ########### SOURCES SECTION ############################################
Room.prototype.initSources = function () {
    if (!this.memory.sources) this.memory.sources = {};
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = this.find(FIND_SOURCES)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var source = _step.value;

            if (!this.memory.sources[source.id]) this.memory.sources[source.id] = { id: source.id };
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    this.memory.hostileSpawnIds = [];
    this.memory.hostileSpawns = this.find(STRUCTURE_KEEPER_LAIR);
    for (var i in this.memory.hostileSpawns) {
        this.memory.hostileSpawnIds[i] = this.memory.hostileSpawns[i].id;
    }
};
Room.prototype.loadSources = function () {
    this.sources = {};
    for (var id in this.memory.sources) {
        this.sources[id] = Game.getObjectById(id);
    }

    this.hostileSpawns = [];
    for (var hostileSpawnNr in this.memory.hostileSpawns) {
        var hostileSpawnId = this.memory.hostileSpawns[hostileSpawnNr].id;
        this.hostileSpawns[hostileSpawnNr] = Game.getObjectById(hostileSpawnId);
    }
};
Room.prototype.initDynamicSources = function () {
    this.memory.sourcesSaveCount = 0;
    this.memory.sourceSpotCount = 0;
    this.memory.sourceLinkCnt = 0;
    for (var id in this.sources) {
        var source = this.sources[id];
        if (source instanceof Source) {
            source.getMemory().isSave = this.creepsHealer.length >= 4 * this.hostileSpawns.length && this.creepsRanger.length >= 3 * this.hostileSpawns.length || !source.getMemory().hasHostileSpawn;
            if (source.getMemory().isSave) {
                this.memory.sourcesSaveCount++;
                this.memory.sourceSpotCount += source.getSpotsCnt();
            }

            var link = source.pos.findInRangeLink(2);
            if (link[0] !== undefined) {
                source.getMemory().linkId = link[0].id;
                this.memory.sourceLinkCnt++;
            }
        } else {
            delete this.sources[id];
            this.logError('source not valid');
        }
    }
};

// ########### STRUCTURES SECTION #############################################
Room.prototype.initDynamicStructures = function () {
    this.memory.extensionIds = [];
    this.extensions = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_EXTENSION } });
    for (var i in this.extensions) {
        if (this.extensions[i] instanceof StructureExtension) {
            this.memory.extensionIds[i] = this.extensions[i].id;
        } else {
            this.logError('extension is not instanceof StructureExtension');
            this.extensions.splice(i);
        }
    }

    if (this.storage instanceof StructureStorage && this.controller.pos.inRangeTo(this.storage, 4)) {
        this.memory.controllerRefillId = this.storage.id;
    } else {
        var containers = this.controller.pos.findInRange(FIND_STRUCTURES, 4, { filter: { structureType: STRUCTURE_CONTAINER } });
        if (containers.length > 0 && containers[0] instanceof StructureContainer) {
            this.memory.controllerRefillId = containers[0].id;
        } else {
            var spawns = this.controller.pos.findInRange(FIND_MY_STRUCTURES, 4, { filter: { structureType: STRUCTURE_SPAWN } });
            if (spawns.length > 0 && spawns[0] instanceof StructureSpawn) this.memory.controllerRefillId = spawns[0].id;
        }
    }

    if (this.getStorage() instanceof Structure) {
        var links = this.getStorage().pos.findInRangeLink(2);
        if (links[0] !== undefined) this.memory.storageLinkId = links[0].id;
    }
};
Room.prototype.loadStructures = function () {
    this.extensions = [];
    for (var i in this.memory.extensionIds) {
        var extensionId = this.memory.extensionIds[i];
        this.extensions[i] = Game.getObjectById(extensionId);
    }
    if (this.memory.storageLinkId !== undefined) {
        this.storageLink = Game.getObjectById(this.memory.storageLinkId);
        if (!this.storageLink instanceof StructureLink) {
            this.logError("Storage Link with ID " + this.memory.storageLinkId + " does not exist.");
        }
    }
    if (this.memory.controllerRefillId !== undefined) {
        this.controllerRefill = Game.getObjectById(this.memory.controllerRefillId);
        if (!(this.controllerRefill instanceof StructureStorage || this.controllerRefill instanceof StructureSpawn || this.controllerRefill instanceof StructureContainer)) {
            this.logError("Controller Storage with ID " + this.memory.controllerRefillId + " does not exist.");
        }
    }
};
Room.prototype.linkAction = function () {
    if (this.storageLink instanceof Structure) for (var i in this.sources) {
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
Room.prototype.getStorage = function () {
    if (this.storage === undefined) {
        var storages = this.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_STORAGE } });
        if (storages[0] !== undefined) {
            this.storage = storages[0];
        } else {
            this.storage = false;
        }
    }
    return this.storage;
};
// ########### CONSTRUCTION SECTION ###########################################
Room.prototype.initDynamicConstructions = function () {
    this.memory.constructionIds = [];

    this.constructions = this.find(FIND_CONSTRUCTION_SITES);
    for (var i in this.constructions) this.memory.constructionIds[i] = this.constructions[i].id;
};
Room.prototype.loadConstructions = function () {
    this.constructions = [];
    for (var i in this.memory.constructionIds) {
        this.constructions[i] = Game.getObjectById(this.memory.constructionIds[i]);
    }
};

// ########### CREEPS SECTION #############################################
Room.prototype.initCreeps = function () {
    this.creepsDefault = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_DEFAULT' } } });
    this.creepsHarvester = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_HARVESTER' } } });
    this.creepsUpgrader = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_UPGRADER' } } });
    this.creepsCarrier = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_CARRIER' } } });
    this.creepsCarrierTiny = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_CARRIER_TINY' } } });
    this.creepsRanger = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_RANGER' } } });
    this.creepsHealer = this.find(FIND_MY_CREEPS, { filter: { memory: { body: 'BODY_HEALER' } } });
    //this.creeps = this.find(FIND_MY_CREEPS);
    this.creeps = this.creepsDefault.concat(this.creepsHarvester, this.creepsUpgrader, this.creepsRanger, this.creepsHealer, this.creepsCarrierTiny);
};
Room.prototype.getDefaultHarvesterCount = function () {
    if (this.defaultHarvesterCount === undefined) {
        this.defaultHarvesterCount = 0;
        if (this.creepsHarvester.length === 0) {
            this.defaultHarvesterCount = 1;
        }
    }
    return this.defaultHarvesterCount;
};
Room.prototype.getDefaultUpgraderCount = function () {
    if (this.controllerRefill instanceof Structure) return 0;else return 1;
};
Room.prototype.getDefaultCarrierCount = function () {
    /*if (! (this.controllerRefill instanceof Structure)){
        return 2 * (this.memory.sourcesSaveCount - this.memory.sourceLinkCnt);
    } else*/return 0;
};
Room.prototype.getDefaultBuilderCount = function () {
    var cnt = 0;
    //    if (this.constructions.length >= 4) ++ cnt;
    //    if (this.constructions.length >= 3) ++ cnt;
    if (this.constructions.length >= 2) ++cnt;
    if (this.constructions.length >= 1) ++cnt;
    return cnt;
};
Room.prototype.creepsRequired = function () {
    return this.getDefaultHarvesterCount() + this.getDefaultCarrierCount() + this.getDefaultUpgraderCount() + this.getDefaultBuilderCount(); //harvester, upgrader, @TODO: builder/repairer
};

Room.prototype.creepsHarvesterCnt = function () {
    var cnt = 0;
    var tasks = this.getTasks();
    for (var i in tasks.collection) if (tasks.collection[i].getType() === 'TASK_HARVEST') {
        cnt += Math.min(tasks.collection[i].getQty() / 2, tasks.collection[i].getCnt());
    }
    return cnt;
};
/**
 * Calculates the number of required carrier creeps.
 * Depends on harvesters (harvesters create energy, which is just dropped)
 *   and links at energy source (is probably not required to be carried)
 *   and maybe dropped energy (if alot)
 * @return {Number}
 */
Room.prototype.creepsCarrierCnt = function () {
    var cnt = 0;

    //cnt += (2 * this.creepsHarvester.length) - this.memory.sourceLinkCnt; // this.memory.sourcesSaveCount-
    for (var i in this.creepsHarvester) {
        var creep = this.creepsHarvester[i];
        var task = creep.getCurrentTask();
        if (task instanceof CTask) {
            var source = task.getTarget();
            if (source instanceof Source) {
                cnt += source.getMemory().linkId ? 1 : 2;
            }
        }
    }

    return cnt;
};
Room.prototype.creepsCarrierTinyCnt = function () {
    var cnt = 0; //2 * (this.memory.sourcesSaveCount - this.memory.sourceLinkCnt);
    if (this.memory.storageLinkId) cnt++;
    return cnt;
};
Room.prototype.getCreepsUpgraderCnt = function () {
    if (this.creepsUpgraderCnt === undefined) {
        if (this.controllerRefill instanceof Structure) {
            this.creepsUpgraderCnt = 1;
            if (this.controllerRefill instanceof StructureStorage) {
                if (this.storage.store.energy > 900000) {
                    ++this.creepsUpgraderCnt;
                    if (this.storage.store.energy > 920000) ++this.creepsUpgraderCnt;
                }
            }
        }
    }
    return this.creepsUpgraderCnt;
};

// ########### SPAWN SECTION ############################################
Room.prototype.spawnAction = function () {
    for (var spawnId in this.spawns) {
        var spawn = this.spawns[spawnId];

        if (this.creepsDefault.length >= this.creepsRequired() && this.creepsHarvester.length < this.creepsHarvesterCnt()) {
            spawn.spawnHarvester();
        } else if (this.creepsDefault.length < this.creepsRequired()) {
            spawn.spawnDefault();
        } else if (this.creepsUpgrader.length < this.getCreepsUpgraderCnt()) {
            spawn.spawnUpgrader();
        } else if (this.controller instanceof StructureStorage && this.storageLink instanceof StructureLink && this.creepsCarrierTiny.length < this.creepsCarrierTinyCnt()) {
            spawn.spawnCarrierTiny();
        } else if (this.creepsCarrier.length < this.creepsCarrierCnt()) {
            spawn.spawnCarrier();
        } else if (this.creepsHealer.length < 2 && this.extensions.length >= 20 && this.energyAvailable >= this.energyCapacityAvailable) {
            spawn.spawnHealer();
        } else if (this.creepsRanger.length < 4 && this.extensions.length >= 20 && this.energyAvailable >= this.energyCapacityAvailable) {
            spawn.spawnRanger();
        } else if (this.isEnergyMax() && this.creepsUpgrader.length < 4) {
            // spawn another upgrader, because has to many energy
            spawn.spawnUpgrader();
        } else {
            this.log('SPAWN: no creep is required');
        }
        break; // todo: multispawn problem quickfix
    }
};

Room.prototype.hasEnergy = function (e) {
    return this.energyAvailable >= e;
};
Room.prototype.hasEnergyCapacity = function (e) {
    return this.energyCapacityAvailable >= e;
};
Room.prototype.isEnergyMax = function (e) {
    return this.energyCapacityAvailable === this.energyAvailable;
};

// ########### HOSTILE SECTION ###########################################
Room.prototype.getHostileCreeps = function () {
    if (this.hostileCreeps === undefined) {
        var opts = {};
        opts.filter = function (object) {
            return object.owner.username !== 'NhanHo';
        };
        this.hostileCreeps = this.find(FIND_HOSTILE_CREEPS, opts);
        for (var i in this.hostileCreeps) {
            var c = this.hostileCreeps[i];
            if (c.owner.username !== 'Source Keeper') {
                Game.notify("User " + c.owner.username + " moved into room " + this.name + " with body " + JSON.stringify(c.body), 0);
            }
        }
    }
    return this.hostileCreeps;
};
Room.prototype.getUnsavePostions = function () {
    if (this.poss === undefined) {
        this.poss = [];
        var creeps = this.getHostileCreeps();
        for (var i in creeps) {
            var creep = creeps[i];
            this.poss = this.poss.concat(creep.pos.getInRangePositions(3));
        }
    }
    return this.poss;
};

// ########### OTHER SECTION ############################################
Room.prototype.hasCreep = function (bodyType, setNoCreep) {
    if (this.noCreep === undefined) this.noCreep = [];
    if (setNoCreep) this.noCreep[bodyType] = true;
    return this.noCreep[bodyType] === undefined;
};
Room.prototype.hasCreepEmpty = function (bodyType, setNoCreep) {
    if (this.noCreepEmpty === undefined) this.noCreepEmpty = [];
    if (setNoCreep) this.noCreepEmpty[bodyType] = true;
    return this.noCreepEmpty[bodyType] === undefined;
};
Room.prototype.hasCreepFull = function (bodyType, setNoCreep) {
    if (this.noCreepFull === undefined) this.noCreepFull = [];
    if (setNoCreep) this.noCreepFull[bodyType] = true;
    return this.noCreepFull[bodyType] === undefined;
};

Room.prototype.resetFind = function (bodyType, setNoCreep) {
    delete this.noCreep;
    delete this.noCreepEmpty;
    delete this.noCreepFull;
};

// ########### LOGGING SECTION ############################################
Room.prototype.log = function (message) {
    Logger.log('[' + this.name + "] " + message);
};
Room.prototype.logError = function (message) {
    Logger.logError('[' + this.name + "] " + message);
};

var methods = ['run', 'initSources', 'loadSources', 'loadStructures', 'loadConstructions', 'initDynamicSources', 'initDynamicConstructions', 'initDynamicStructures', 'linkAction', 'spawnAction'];
for (var i in methods) {
    Profiler._.wrap('Room', Room, methods[i]);
    Logger._.wrap('Room', Room, methods[i]);
}
