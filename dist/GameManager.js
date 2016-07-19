"use strict";

let Logger = require('Logger');
let Profiler = require('Profiler');

class GameManager {

    /**
     * Get the singleton object
     * @return {GameManager}
     */
    static get _ () {
       if (GameManager._singleton === undefined)
            GameManager._ = new GameManager();
       return GameManager._singleton;
    }

    /**
     * Set the singleton object
     * @param {GameManager}
     */
    static set _ (singleton) {
        GameManager._singleton = singleton;
    }

    /**
     * Init the class
     * @return {GameManager}
     */
    static init () {
        if (GameManager._init !== true) {
           GameManager._init = true;

           var methods = [];
           for (var i in methods) {
               Profiler._.wrap('GameManager', GameManager, methods[i]);
               Logger._.wrap('GameManager', GameManager, methods[i]);
           }
        }
    }

    /**
     * Instantiate the GameManager class
     * @constructor
     * @this {GameManager}
     */
    constructor () {
        GameManager.init();
    }

    /**
     * Get memory
     * @return {Object}
     */
    get memory () {
       if (Memory.GameManager === undefined) Memory.GameManager = {};
       return Memory.GameManager;
    }

    /**
     *
     */
    run () {
        if (Memory.stats === undefined) Memory.stats = {};
        Memory.stats["Game.cpu.limit"] = Game.cpu.limit;
        Memory.stats["Game.cpu.tickLimit"] = Game.cpu.tickLimit;
        Memory.stats["Game.cpu.bucket"] = Game.cpu.bucket;
        Memory.stats["Game.gcl.level"] = Game.gcl.level;
        Memory.stats["Game.gcl.progress"] = Game.gcl.progress;
        Memory.stats["Game.gcl.progressTotal"] = Game.gcl.progressTotal;
        
        this.garbageCollection();
    }

    /**
     *
     */
    garbageCollection () {
        if (Game.time % 1 == 0) {
        	if (Memory.creeps)
                _.difference(Object.keys(Memory.creeps),Object.keys(Game.creeps)).forEach(function(key) {
                    if (Memory.creeps[key].tasks)
                        for ( let roomName in Memory.creeps[key].tasks ) {
                            let taskCode = Memory.creeps[key].tasks[roomName];
                            if ( Game.rooms[roomName] && Game.rooms[roomName].getTasks().collection[taskCode])
                                Game.rooms[roomName].getTasks().collection[taskCode].assignmentDelete(key);
                        }
                    delete Memory.creeps[key]
                });
        	if (Memory.flags)
                _.difference(Object.keys(Memory.flags),Object.keys(Game.flags)).forEach(function(key) {delete Memory.flags[key]});
        	if (Memory.rooms)
                _.difference(Object.keys(Memory.rooms),Object.keys(Game.rooms)).forEach(function(key) {delete Memory.rooms[key]});
        	if (Memory.spawns)
                _.difference(Object.keys(Memory.spawns),Object.keys(Game.spawns)).forEach(function(key) {delete Memory.spawns[key]});
        	if (Memory.structures)
                _.difference(Object.keys(Memory.structures),Object.keys(Game.structures)).forEach(function(key) {delete Memory.structures[key]});
        }
    }

};

module.exports = GameManager;
