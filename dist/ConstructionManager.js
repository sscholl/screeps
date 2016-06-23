"use strict";

let Logger = require('Logger');
let Profiler = require('Profiler');

class ConstructionManager {

    /**
     * Init the class
     */
    static init () {
        if (ConstructionManager._init !== true) {
           ConstructionManager._init = true;
           var methods = ['run', 'planInfrastructure', 'flagRoad'];
           for (var i in methods) {
               Profiler._.wrap('ConstructionManager', ConstructionManager, methods[i]);
               Logger._.wrap('ConstructionManager', ConstructionManager, methods[i]);
           }
        }
    }

    /*
     * get cached instance
     * @return {ConstructionManager}
     */
    static getInstance (room) {
        ConstructionManager._instances = ConstructionManager._instances || {};
        if (! ConstructionManager._instances[room.name])
            ConstructionManager._instances[room.name] = new ConstructionManager(room);
        return ConstructionManager._instances[room.name];
    }

    /**
     * Instantiate the ConstructionManager class
     * @constructor
     * @this {ConstructionManager}
     */
    constructor (room) {
        ConstructionManager.init();
        this._room = room;
    }

    /**
     * @return {Object}
     */
    get memory () {
        if (this._memory === undefined) {
            this._memory = this.room.memory.constructionManager;
            if (this._memory === undefined) {
                this._memory = this.memory = { }; //TODO: check memory setter
                this.memory.roads = [];
                this.memory.occupied = new Array(50);
                for (var i = 0; i < 50; ++ i) {
                  this.memory.occupied[i] = new Array(50);
                }
            }
        }
        return this._memory;
    }

    set memory (v) {
        this.room.memory.constructionManager = v;
    }

    /**
     * @return {Room}
     */
    get room () {
       return this._room;
    }

    /**
     * get a flag of this room
     * @param {Flag}
     */
    flag (structure, number = '') {
        return Game.flags[this.flagName(structure, number)];
    }

    /**
     * get a flag name
     * @param {Flag}
     */
    flagName (structure, number = '') {
        return this.room.name + structure + number;
    }

    /**
     * plan the constructions of room
     */
    run () {
        if ( this.room.controller instanceof StructureController) { // TODO: downgrade by accident??  &&   this.memory._plannedLevel !== this.room.controller.level
            this.planInfrastructure();
            for (var structureType in CONTROLLER_STRUCTURES) {
                var max = CONTROLLER_STRUCTURES[structureType][this.room.controller.level];
                for (var i = 0; i < max; ++ i) {
                    switch (structureType) {
                        case STRUCTURE_SPAWN:
                            //in range 4 to controller (if possible)
                            break;
                        case STRUCTURE_POWER_SPAWN: break;
                        case STRUCTURE_EXTENSION:

                            break;
                        case STRUCTURE_LINK:

                            break;
                        case STRUCTURE_CONTAINER:
                            if (this.room.controller.level >= 5) {
                                //add containers below source spot
                            }
                            break;
                        case STRUCTURE_STORAGE:

                            break;
                        case STRUCTURE_TOWER:
                            break;
                        case STRUCTURE_ROAD:
                            i = max;
                            break;
                        case STRUCTURE_WALL:
                            i = max;
                            break;
                        case STRUCTURE_RAMPART:
                            i = max;
                            break;
                        case STRUCTURE_OBSERVER: break;
                        case STRUCTURE_EXTRACTOR: break;
                        case STRUCTURE_LAB: break;
                        case STRUCTURE_TERMINAL: break;
                        case STRUCTURE_NUKER: break;
                        default:
                            Logger.logError('The structure type ' + structureType + ' is not handled.');
                    }
                }
            }
            //TODO: this.memory._plannedLevel = this.room.controller.level;
        }
        //CONSTRUCTION_COST[STRUCTURE_SPAWN]
        //CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][controllerLevel] = max;
        //MAX_CONSTRUCTION_SITES
    }

    planInfrastructure() {
        if (this.memory._plannedInfrastructure === undefined) {
            /* ROADS */
            for (var i in this.room.exits) {
                this.addRoad(this.room.exits[i], this.room.centerPos);
            }
            for (var i in this.room.sources) {
                this.addRoad(this.room.sources[i].pos, this.room.centerPos);
            }
            /* WALLS AND RAMPARDS*/
            for (var i of Room.EXITS) {
                var exits = this.room.find(i);
                for (var j in exits) {
this.room.createFlag(exits[j].x, exits[j].y);
                }
                Logger.logDebug(exits);
            }
            this.memory._plannedInfrastructure = true;
        }
    }

    addRoad (from, to) {
        var path = this.room.findPath(from, to, { ignoreCreeps: true });
        this.memory.roads.push(path);
        this.flagRoad(path);
    }

    flagRoad (path) {
        if (this.memory.flagRoadCount === undefined)
            this.memory.flagRoadCount = 0;
        for ( var i in path ) {
            var name = this.flagName(STRUCTURE_ROAD, this.memory.flagRoadCount ++);
            var r = this.room.createFlag(path[i].x, path[i].y, name, COLOR_WHITE, COLOR_CYAN);
            if (r !== name)
                this.room.logError("Flag " + name + " can't be created.");
            if (r === ERR_NAME_EXISTS)
                this.room.logError("Flag " + name + " already exists.");
        }
    }

    buildRoad (from, to) {
        var path = this.room.findPath(from, to, { ignoreCreeps: true });
        for ( var i in path ) {
            var result = this.room.createConstructionSite(path[i].x, path[i].y, Game.STRUCTURE_ROAD);
        }
    }

};

module.exports = ConstructionManager;
