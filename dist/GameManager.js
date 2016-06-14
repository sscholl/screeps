let Logger = require('Logger');
let Profiler = require('Profiler');

var GameManager = class GameManager {

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
     * Get memory
     * @return {Object}
     */
    get memory () {
       if (Memory.GameManager === undefined) Memory.GameManager = {};
       return Memory.GameManager;
    }

    /**
     * Instantiate the Profiler class
     * @constructor
     * @this {Profiler}
     */
    constructor () {
    }

    /**
     * Apply the wrapper functions to classes to measure timings
     */
    init () {

        if (!this.memory.timer || this.memory.timer <= 0) {
            this.memory.timer = 60;
            this.garbageCollection;
        }
        -- this.memory.timer;
    }

    /**
     * Apply the wrapper functions to classes to measure timings
     */
    garbageCollection () {
        for(var i in Memory.creeps)
            if(!Game.creeps[i])
                delete Memory.creeps[i];
    }

};

module.exports = GameManager;

var methods = ['init'];
for (var i in methods) {
    Profiler._.wrap('GameManager', GameManager, methods[i]);
    Logger._.wrap('GameManager', GameManager, methods[i]);
}
