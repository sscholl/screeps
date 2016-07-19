"use strict";

let Profiler = require('Profiler');
let Logger = require('Logger');

let ConstructionManager = require('ConstructionManager');
let CTask = require('CTask');

module.exports = function () {
    if ( Room._initDebug !== true ) {
        Room._initDebug = true;
        let methods = ['run', 'initSources', 'initDynamicSources', 'initDynamicConstructions', 'initDynamicStructures', 'linkAction', 'towerAction', 'spawnAction'];
        for ( let i in methods ) {
            Profiler._.wrap('Room', Room, methods[i]);
            Logger._.wrap('Room', Room, methods[i]);
        }
    }
}

Room.EXITS = [FIND_EXIT_TOP, FIND_EXIT_BOTTOM, FIND_EXIT_LEFT, FIND_EXIT_RIGHT];

/**
 * add getter and setter for memory
 */
Object.defineProperty(Room.prototype, "constructionManager", {
    get: function () {
        if (this._constructionManager === undefined) {
            this._constructionManager = ConstructionManager.getInstance(this);
        }
        return this._constructionManager;
    },
    set: function (v) {
        this._constructionManager = v;
    },
});

Object.defineProperty(Room.prototype, "flag", { get: function () {
        if (this._flag === undefined) {
            this._flag = Game.flags[this.name];
            if ( ! this._flag ) this._flag = null;
        }
        return this._flag;
}});
Object.defineProperty(Room.prototype, "centerPos", { get: function () {
        if (this._centerPos === undefined) {
            if (this.spawns && this.spawns[0] instanceof StructureSpawn) this._centerPos = this.spawns[0].pos;
            else if (this.flag)         this._centerPos = this.flag.pos;
            else if (this.controller)   this._centerPos = this.controller.pos;       //TODO: change to spawn loc
            else                        this._centerPos = this.getPositionAt(24,24); //TODO: check if wall exists
        }
        return this._centerPos;
}});

/**
 * add getter and setter for memory
 */
Object.defineProperty(Room.prototype, "exits", {
    get: function () {
        if (this._exits === undefined) {
            if (this.memory.exits === undefined) {
                this.memory.exits = {};
                for (let i of Room.EXITS) {
                    let closest = this.centerPos.findClosestByPath(i);
                    if (closest)
                        this.memory.exits[i] = closest;
                }
            }
            this._exits = this.memory.exits;
            for (let i in this._exits)
                this._exits[i].__proto__ = RoomPosition.prototype;
        }
        return this._exits;
    },
    set: function (v) {
        delete this._exits;
        this.memory.exits = v;
    },
});

Object.defineProperty(Room.prototype, "spawns", { get: function () {
    if (this._spawns === undefined)
        this._spawns = this.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_SPAWN}});
    return this._spawns;
}});

Object.defineProperty(Room.prototype, "defaultSpawn", { get: function () {
    if ( this.spawns.length > 0 )
        return this.spawns[0];
}});

Object.defineProperty(Room.prototype, "towers", { get: function () {
    if (this._towers === undefined) {
        if ( this.controller && this.controller.my )
            this._towers = this.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_TOWER}});
        else
            this._towers = [];
    }
    return this._towers;
}});
Object.defineProperty(Room.prototype, "labs", { get: function () {
    if (this._labs === undefined)
        this._labs = this.find(FIND_MY_STRUCTURES, {filter:{structureType:STRUCTURE_LAB}});
    return this._labs;
}});

Object.defineProperty(Room.prototype, "hostileCreeps", { get: function () {
    if ( this._hostileCreeps === undefined ) {
        this._hostileCreeps = [];
        this._hostileCreeps = this.find(FIND_HOSTILE_CREEPS);
        for ( let c of this._hostileCreeps ) {
            if ( ! c.isSourceKeeper() && ! c.isInvader() && this.controller && this.controller.my ) {
                Game.notify("User " + c.owner.username + " moved into room " + this.name + " with body " + JSON.stringify(c.body), 0);
            }
        }
    }
    return this._hostileCreeps;
}});

Object.defineProperty(Room.prototype, "unsavePostions", { get: function () {
    if ( this._unsavePostions === undefined ) {
        this._unsavePostions = [];
        for (let c of this.hostileCreeps ) {
            this._unsavePostions = this._unsavePostions.concat(c.pos.getInRangePositions(3));
        }
    }
    return this._unsavePostions;
}});

Object.defineProperty(Room.prototype, "remoteRoomNames", { get: function () {
    if ( this._remoteRoomNames === undefined ) {
        this._remoteRoomNames = [];
        for ( let f of this.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_WHITE } } ) ) {
            let s = f.name.split('_');
            if ( s.length === 3 && s[0] === 'R' && s[1] === this.name )
                this._remoteRoomNames.push(s[2]);
        }
    }
    return this._remoteRoomNames;
}});
Object.defineProperty(Room.prototype, "remoteRooms", { get: function () {
    if ( this._remoteRooms === undefined ) {
        this._remoteRooms = [];
        for ( let r of this.remoteRoomNames ) {
            if ( Game.rooms[r] )
                this._remoteRooms.push(Game.rooms[r])
        }
    }
    return this._remoteRooms;
}});

// ######### Room #############################################################

Room.prototype.run = function() {
    this.resetFind();
    this.initCreeps();
    if (!this.memory.timer || this.memory.timer % 60 === 0) {
        this.memory.timer = -1;
        this.initSources();
        this.memory.timer = 60;
    }

    this.loadSources();
    this.loadStructures();
    this.loadConstructions();
    this.energy = this.findDroppedEnergy();

    //this.constructionManager.run();

    if (this.memory.timer % 1 === 0) {
        this.initDynamicSources();
        this.initDynamicConstructions();
        this.initDynamicStructures();
    }

    if (this.memory.timer % 60 === 0) {
        this.initTasksStatic();
    }
    if (this.memory.timer % 15 == 0) {
        this.initTasksDynamic2();
    }
    if (this.memory.timer % 1 == 0) {
        this.initTasksDynamic();
    }

    let withHandshake = this.memory.timer % 1 === 0;
    this.assignTasks(withHandshake);
    this.linkAction();
    this.spawnAction();

    this.towerAction();



    -- this.memory.timer;

    if ( this.controller instanceof StructureController ) {
        if ( this.controller.my ) {
            Memory.stats["room." + this.name + ".energyAvailable"] = this.energyAvailable;
            Memory.stats["room." + this.name + ".energyCapacityAvailable"] = this.energyCapacityAvailable;
            Memory.stats["room." + this.name + ".controller.progress"] = this.controller.progress;
            Memory.stats["room." + this.name + ".controller.progressTotal"] = this.controller.progressTotal;
            Memory.stats["room." + this.name + ".controller.level"] = this.controller.level;
            if ( this.storage instanceof StructureStorage ) {
            Memory.stats["room." + this.name + ".storage.storeCapacity"] = this.storage.storeCapacity;
            for (let i of RESOURCES_ALL) if ( Memory.stats["room." + this.name + ".storage.store." + i] !== undefined || this.storage.store[i] > 0 )Memory.stats["room." + this.name + ".storage.store." + i] = this.storage.store[i];
            }
        } else if ( this.controller.reservation && this.controller.reservation.username === 'sscholl' ) {
            Memory.stats["room." + this.name + ".controller.reservationTicksToEnd"] = this.controller.reservation.ticksToEnd;
        } else if ( Memory.stats["room." + this.name + ".controller.reservationTicksToEnd"] !== undefined ) {
            Memory.stats["room." + this.name + ".controller.reservationTicksToEnd"] = 0;
        }
    }
    for (let i in this.sources) {
        let key = "room." + this.name + ".sources." + this.sources[i].pos.x + "_" + this.sources[i].pos.y + ".energy";
        if ( Memory.stats[key] !== undefined || this.sources[i].energy !== this.sources[i].energyCapacity ) Memory.stats[key] = this.sources[i].energy;
    }
    let key = "room." + this.name + ".hostileCreeps.count";
    let cnt = this.hostileCreeps.length;
    if ( Memory.stats[key] !== undefined || cnt ) Memory.stats[key] = cnt;
};

// ########### SOURCES SECTION ############################################
Room.prototype.initSources = function() {
    if (!this.memory.sources) this.memory.sources = {};
    for (let source of this.find(FIND_SOURCES))
        if (!this.memory.sources[source.id])
            this.memory.sources[source.id] = {id: source.id};
    this.memory.hostileSpawnIds = [];
    this.memory.hostileSpawns = this.find(STRUCTURE_KEEPER_LAIR);
    for (let i in this.memory.hostileSpawns) {
        this.memory.hostileSpawnIds[i] = this.memory.hostileSpawns[i].id;
    }
}
Room.prototype.loadSources = function() {
    this.sources = {};
    for (let id in this.memory.sources) {
        this.sources[id] = Game.getObjectById(id);
    }

    this.hostileSpawns = [];
    for (let i in this.memory.hostileSpawns) {
        let i = this.memory.hostileSpawns[i].id;
        this.hostileSpawns[i] = Game.getObjectById(hostileSpawnId);
    }
};
Room.prototype.initDynamicSources = function() {
    this.memory.sourcesSaveCount = 0;
    this.memory.sourceSpotCount = 0;
    for (let id in this.sources) {
        let source = this.sources[id];
        if (source instanceof Source) {
            source.memory.isSave = ! source.memory.hasHostileSpawn;
            if (source.memory.isSave) {
                this.memory.sourcesSaveCount ++;
                this.memory.sourceSpotCount += source.getSpotsCnt();
            }
        } else {
            delete this.sources[id];
            this.logError('source not valid');
        }
    }
};

// ########### STRUCTURES SECTION #############################################
Room.prototype.initDynamicStructures = function() {
    this.memory.extensionIds = [];
    this.extensions = this.find( FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_EXTENSION}} );
    for (let i in this.extensions) {
        if (this.extensions[i] instanceof StructureExtension) {
            this.memory.extensionIds[i] = this.extensions[i].id;
        } else {
            this.logError('extension is not instanceof StructureExtension');
            this.extensions.splice(i);
        }
    }

    if ( this.controller instanceof StructureController )
        if ( this.storage instanceof StructureStorage && this.controller.pos.inRangeTo(this.storage, 4) ) {
            this.memory.controllerRefillId = this.storage.id;
        } else {
            let containers = this.controller.pos.findInRange( FIND_STRUCTURES, 4, {filter: {structureType: STRUCTURE_CONTAINER}} );
            if (containers.length > 0 && containers[0] instanceof StructureContainer) {
                this.memory.controllerRefillId = containers[0].id;
            } else {
                let spawns = this.controller.pos.findInRange( FIND_MY_STRUCTURES, 4, {filter: {structureType: STRUCTURE_SPAWN}} );
                if (spawns.length > 0 && spawns[0] instanceof StructureSpawn)
                    this.memory.controllerRefillId = spawns[0].id;
            }
        }

    if (this.storage instanceof StructureStorage) {
        let links = this.storage.pos.findInRangeLink(2);
        if (links[0] !== undefined) this.memory.storageLinkId = links[0].id;
    }
}
Room.prototype.loadStructures = function() {
    this.extensions = [];
    for (let i in this.memory.extensionIds) {
        let extensionId = this.memory.extensionIds[i];
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
        if ( ! (this.controllerRefill instanceof StructureStorage || this.controllerRefill instanceof StructureSpawn || this.controllerRefill instanceof StructureContainer) ) {
            this.logError("Controller Storage with ID " + this.memory.controllerRefillId + " does not exist.");
        }
    }

};
Room.prototype.linkAction = function() {
    if (this.storageLink instanceof Structure)
        for (let i in this.sources) {
            let link = this.sources[i].link;
            if ( link instanceof StructureLink ) {
                if (link.isFull() && this.storageLink.isEmpty()) {
                    link.transferEnergy(this.storageLink);
                    break; // do not transfer from 2 links at the same time
                }
            }
        }
};
Room.prototype.towerAction = function () {
    if ( ! this.towers.length ) return;

    let damagedCreep = this.find(FIND_MY_CREEPS, {
        filter: function(object) {return object !== this && object.hits < object.hitsMax;}
    });
    let enemies = this.find(FIND_HOSTILE_CREEPS);
    let structuresNeedsRepair = this.find(FIND_STRUCTURES, {
        filter: function(i) { return i.needsRepair(); }
    });
    for (let i in this.towers) {
        if ( this.towers[i].energy > 0) {
            let r = OK;
            if (damagedCreep.length > 0 && damagedCreep[0] instanceof Creep && damagedCreep[0].ticksToLive > 50) {
                r = this.towers[i].heal(damagedCreep[0]);
            } else if (enemies.length > 0 && enemies[0] instanceof Creep) {
                r = this.towers[i].attack(enemies[0]);
            } else if ( this.towers[i].energy > 500 && (( this.storage instanceof StructureStorage && this.storage.store.energy > 10000 ) || ! (this.storage instanceof StructureStorage )) ) {
                let structureLowest = undefined;
                for (let j in structuresNeedsRepair) {
                    let structure = structuresNeedsRepair[j];
                    if ( structure instanceof Structure )
                        if ( structure instanceof StructureWall || structure instanceof StructureRampart ) {
                            if (structureLowest instanceof Structure) {
                                if (structure.hits < structureLowest.hits) structureLowest = structure;
                            } else {
                                structureLowest = structure;
                            }
                        } else {
                            structureLowest = structure;
                            break;
                        }
                }
                if (structureLowest instanceof Structure) {
                    let r = this.towers[i].repair(structureLowest);
                }
            }
            if ( r !== OK ) this.logError("tower can't do action: " + r);
        }
    }
};
// ########### CONSTRUCTION SECTION ###########################################
Room.prototype.initDynamicConstructions = function() {
    this.memory.constructionIds = [];

    this.constructions = this.find(FIND_CONSTRUCTION_SITES);
    for (let i in this.constructions)
        this.memory.constructionIds[i] = this.constructions[i].id;
};
Room.prototype.loadConstructions = function() {
    this.constructions = [];
    for (let i in this.memory.constructionIds) {
        this.constructions[i] = (Game.getObjectById(this.memory.constructionIds[i]));
    }
};

// ########### CREEPS SECTION #############################################
Room.prototype.initCreeps = function() {
    this.creepsDefault = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_DEFAULT'}}});
    this.creepsHarvester = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_HARVESTER'}}});
    this.creepsUpgrader = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_UPGRADER'}}});
    this.creepsCarrier = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_CARRIER'}}});
    this.creepsCarrierTiny = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_CARRIER_TINY'}}});
    this.creepsRanger = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_RANGER'}}});
    this.creepsHealer = this.find(FIND_MY_CREEPS, {filter: {memory: {body: 'BODY_HEALER'}}});
    //this.creeps = this.find(FIND_MY_CREEPS);
    this.creeps = this.creepsDefault.concat(this.creepsHarvester, this.creepsUpgrader, this.creepsRanger, this.creepsHealer,  this.creepsCarrierTiny);
};
Room.prototype.getDefaultHarvesterCount = function() {
    if (this.defaultHarvesterCount === undefined) {
        this.defaultHarvesterCount = 0;
        if (this.creepsHarvester.length === 0) {
            this.defaultHarvesterCount = 1;
        }
    }
    return this.defaultHarvesterCount;
};
Room.prototype.getDefaultUpgraderCount = function() {
    if ( this.controllerRefill instanceof Structure)    return 0;
    else                                                return 1;
};
Room.prototype.creepsRequired = function() {
    return this.getDefaultHarvesterCount()
        + this.getDefaultUpgraderCount()//harvester, upgrader
};

// ########### SPAWN SECTION ############################################
Room.prototype.spawnAction = function() {
    for (let spawn of this.spawns) {
        if (spawn.spawning) continue;
        if (this.creepsDefault.length < this.creepsRequired()) {
            spawn.spawnDefault();
            return;
        }

        let tasks = this.getTasks();
        let creepName = false;
        let task = false;
        for ( let code of tasks.list ) {
            task = tasks.collection[code];
            if (
                task.qty > task.qtyAssigned
                && task.cnt > task.assignmentsCnt
            ) {
                switch ( task.type ) {
                    case 'TASK_HARVEST':        creepName = spawn.spawnHarvester(); break;
                    case 'TASK_UPGRADE':        if ( this.defaultSpawn.id === spawn.id &&  task.qty - task.qtyAssigned > 2 ) creepName = spawn.spawnUpgrader(undefined, undefined, task.qty); break;
                    case 'TASK_GATHER':         creepName = spawn.spawnCarrier(); break;
                    case 'TASK_REPAIR':
                    case 'TASK_BUILD':          creepName = spawn.spawnDefault(undefined, undefined, 5); break;
                    case 'TASK_FILLSTORAGE':    creepName = spawn.spawnCarrierTiny(); break;
                    case 'TASK_GUARD':          creepName = spawn.spawnRanger(undefined, undefined, task.qty); break;
                }
                if ( creepName ) {
                    task.assignmentCreate(Game.creeps[creepName]);
                    Game.creeps[creepName].taskAssign(task);
                    break;
                }
            }
        }
        if ( ! creepName ) {
            for ( let code of tasks.list ) {
                task = tasks.collection[code];
                if (
                    task.qty > task.qtyAssigned
                    && task.cnt > task.assignmentsCnt
                ) {
                    switch ( task.type ) {
                        case 'TASK_HARVEST_REMOTE': creepName = spawn.spawnHarvester(); break;
                        case 'TASK_GATHER_REMOTE':  creepName = spawn.spawnCarrier(); break;
                        case 'TASK_BUILD_REMOTE':   creepName = spawn.spawnDefault(undefined, undefined, task.qty); break;
                        case 'TASK_RESERVE_REMOTE': creepName = spawn.spawnClaim(undefined, undefined, task.qty); break;
                        case 'TASK_GUARD_REMOTE':   creepName = spawn.spawnRanger(undefined, undefined, task.qty); break;
                    }
                    if ( creepName ) {
                        task.assignmentCreate(Game.creeps[creepName]);
                        Game.creeps[creepName].taskAssign(task);
                        break;
                    }
                }
            }
            if ( ! creepName ) {
                //this.log('SPAWN: no creep is required');
                break;
            }
        }
    }
};

Room.prototype.hasEnergy = function(e) {
    return this.energyAvailable >= e;
};
Room.prototype.hasEnergyCapacity = function(e) {
    return this.energyCapacityAvailable >= e;
};
Room.prototype.hasEnergyCapacitySave = function(e) {
    return this.hasEnergy(e) || (this.hasEnergyCapacity(e) && this.hasBasicInfrastructure());
};
Room.prototype.isEnergyMax = function(e) {
    return this.energyCapacityAvailable === this.energyAvailable;
};
Room.prototype.hasBasicInfrastructure = function(e) {
    return this.creepsHarvester.length >= 1 && this.creepsCarrier.length >= 1;
};

// ########### OTHER SECTION ############################################
Room.prototype.hasCreep = function(bodyType, setNoCreep) {
    if (this.noCreep === undefined)
        this.noCreep = {};
    if (setNoCreep)
        this.noCreep[bodyType] = true;
    return ! this.noCreep[bodyType] ;
};
Room.prototype.hasCreepEmpty = function(bodyType, setNoCreep) {
    if (this.noCreepEmpty === undefined)
        this.noCreepEmpty = {};
    if (setNoCreep)
        this.noCreepEmpty[bodyType] = true;
    return ! this.noCreepEmpty[bodyType] ;
};
Room.prototype.hasCreepFull = function(bodyType, setNoCreep) {
    if (this.noCreepFull === undefined)
        this.noCreepFull = {};
    if (setNoCreep)
        this.noCreepFull[bodyType] = true;
    return ! this.noCreepFull[bodyType] ;
};

Room.prototype.resetFind = function(bodyType, setNoCreep) {
    delete this.noCreep;
    delete this.noCreepEmpty;
    delete this.noCreepFull;
};

Room.prototype.findDroppedEnergy = function() {
    return this.find(FIND_DROPPED_ENERGY,
        { filter: function (energy) { return energy.energy >= 20; } }
    );
};

// ########### LOGGING SECTION ############################################
Room.prototype.log = function(message) {
    Logger.log('[' + this.name + "] " + message);
};
Room.prototype.logError = function(message) {
    Logger.logError('[' + this.name + "] " + message);
};
