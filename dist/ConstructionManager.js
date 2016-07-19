"use strict";

let Logger = require('Logger');
let Profiler = require('Profiler');

class ConstructionManager {

    /**
     * Init the class
     */
    static init() {
        if (ConstructionManager._init !== true) {
            ConstructionManager._init = true;
            let methods = ['run', 'planInfrastructure', 'flagRoad', 'createConstructionFlag'];
            for (let i in methods) {
                Profiler._.wrap('ConstructionManager', ConstructionManager, methods[i]);
                Logger._.wrap('ConstructionManager', ConstructionManager, methods[i]);
            }
        }
    }

    /*
     * get cached instance
     * @return {ConstructionManager}
     */
    static getInstance(room) {
        ConstructionManager._instances = ConstructionManager._instances || {};
        if (!ConstructionManager._instances[room.name])
            ConstructionManager._instances[room.name] = new ConstructionManager(room);
        return ConstructionManager._instances[room.name];
    }

    /**
     * Instantiate the ConstructionManager class
     * @constructor
     * @this {ConstructionManager}
     */
    constructor(room) {
        ConstructionManager.init();
        this._room = room;
    }

    /**
     * @return {Object}
     */
    get memory() {
        if (this._memory === undefined) {
            this._memory = this.room.memory.constructionManager;
            if (this._memory === undefined) {
                this._memory = this.memory = {}; //TODO: check memory setter
                this.memory.roads = [];
                this.memory.occupied = new Array(50);
                for (let i = 0; i < 50; ++i) {
                    this.memory.occupied[i] = new Array(50);
                }
            }
        }
        return this._memory;
    }

    set memory(v) {
        this.room.memory.constructionManager = v;
    }

    /**
     * @return {Room}
     */
    get room() {
        return this._room;
    }

    get dryRun() {
        return this._dryRun;
    }
    set dryRun(v) {
        this._dryRun = v;
    }

    /**
     * get a flag of this room
     * @param {Flag}
     */
    flag(structure, number = '') {
        return Game.flags[this.flagName(structure, number)];
    }

    /**
     * get a flag name
     * @param {Flag}
     */
    flagName(structure, number = '') {
        return this.room.name + structure + number;
    }

    /**
     * plan the constructions of room
     */
    run(dryRun = false) {
        this.dryRun = dryRun;
        if (this.room.controller instanceof StructureController) { // TODO: downgrade by accident??  &&   this.memory._plannedLevel !== this.room.controller.level
            this.planInfrastructure();
            for (let structureType in CONTROLLER_STRUCTURES) {
                let max = CONTROLLER_STRUCTURES[structureType][this.room.controller.level];
                for (let i = 0; i < max; ++i) {
                    switch (structureType) {
                        case STRUCTURE_SPAWN:
                            //in range 4 to controller (if possible)
                            break;
                        case STRUCTURE_POWER_SPAWN:
                            break;
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
                        case STRUCTURE_OBSERVER:
                            break;
                        case STRUCTURE_EXTRACTOR:
                            break;
                        case STRUCTURE_LAB:
                            break;
                        case STRUCTURE_TERMINAL:
                            break;
                        case STRUCTURE_NUKER:
                            break;
                        default:
                            this.room.logError('The structure type ' + structureType + ' is not handled.');
                    }
                }
            }
            //TODO: this.memory._plannedLevel = this.room.controller.level;
        }
        //CONSTRUCTION_COST[STRUCTURE_SPAWN]
        //CONTROLLER_STRUCTURES[STRUCTURE_SPAWN][controllerLevel] = max;
        //MAX_CONSTRUCTION_SITES
        this.dryRun = false;
    }

    planInfrastructure() {
        if (this.memory._plannedInfrastructure === undefined) {
            /* ROADS */
            if (this.room.controller.my) {
                for (let i in this.room.exits) {
                    this.addRoad(this.room.exits[i], this.room.centerPos);
                }
            }
            for (let i in this.room.sources) {
                this.addRoad(this.room.sources[i].spot, this.room.centerPos);
            }
            for ( let f of this.room.find(FIND_FLAGS, { filter: { color: COLOR_WHITE, secondaryColor: COLOR_YELLOW } }) ) {
                this.addRoad(f.pos, this.room.centerPos);
                for ( let s of this.room.spawns ) this.addRoad(f.pos, s.pos);
            }
            for (let f of this.room.find(FIND_FLAGS, { filter: { color: COLOR_YELLOW, secondaryColor: COLOR_GREY } })) {
                this.addRoad(f.pos, this.room.centerPos);
            }
            /* WALLS AND RAMPARDS*/
            for (let i of Room.EXITS) {
                let exits = this.room.find(i);
                for (let j in exits) {
                    //this.room.createFlag(exits[j].x, exits[j].y);
                }
                //Logger.logDebug(exits);
            }
            this.memory._plannedInfrastructure = true;
        }
    }

    addRoad(from, to) {
        let path = this.room.findPath(from, to, {
            ignoreCreeps: true
        });
        if ( path.length ) {
            path.pop();
            this.memory.roads.push(path);
            if (this.dryRun)
                this.flagRoad(path);
            else
                this.buildRoad(path);
        } else {
            this.room.logError("can't find path from " + from + "->" + to + ".")
        }
    }

    flagRoad(path) {
        for ( let i in path ) {
            this.createConstructionFlag(STRUCTURE_ROAD, path[i]);
        }
    }

    buildRoad(path) {
        for ( let i in path ) {
            if ( ! this.room.lookForAt(LOOK_CONSTRUCTION_SITES, path[i].x, path[i].y).length ) {
                let r = this.room.createConstructionSite(path[i].x, path[i].y, STRUCTURE_ROAD);
                if ( r !== OK ) {
                    this.room.logError("could not create constructionSite: " + r);
                    if ( r === ERR_FULL ) {
                        this.room.logError("Limit of 100 constructionSites exhausted.");
                        return;
                    }
                }
            }
        }
    }

    buildContainers() {
        for (let id in this.room.sources) {
            var source = this.room.sources[id];
            if (!(source.link instanceof Structure)) {
                let c = source.spot.lookFor(LOOK_CONSTRUCTION_SITES);
                if (!c.length) {
                    let r = this.room.createConstructionSite(source.spot, STRUCTURE_CONTAINER);
                    if (r !== OK) this.room.log("Can't create construction site: " + r);
                }
            }
        }
    }

    createConstructionFlag(structureType, pos) {
        if (this.memory.flagRoadCount === undefined)
            this.memory.flagRoadCount = 0;
        let name, color1, color2;
        switch (structureType) {
            case STRUCTURE_ROAD:
                name = this.flagName(STRUCTURE_ROAD, this.memory.flagRoadCount++);
                color1 = COLOR_WHITE;
                color2 = COLOR_CYAN;
                break;
            default:
                return -1;
        }

        let r = this.room.createFlag(pos.x, pos.y, name, color1, color2);
        if (r === name) {
            Game.flags[name].memory.isConstruction = true;
        } else {
            this.room.logError("Flag " + name + " can't be created.");
            if (r === ERR_NAME_EXISTS)
                this.room.logError("Flag " + name + " already exists.");
        }
    }

    clear() {
        for (let c of this.room.find(FIND_CONSTRUCTION_SITES))
            if (c.progress === 0)
                c.remove();
        this.memory._plannedInfrastructure = undefined;
        for (let f of this.room.find(FIND_FLAGS, {
                filter: {
                    memory: {
                        isConstruction: true
                    }
                }
            }))
            f.remove();

    }

};

module.exports = ConstructionManager;
