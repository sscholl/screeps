"use strict";

var Logger = class Logger {

    /**
     * Get the singleton object
     * @return {Logger}
     */
    static get _ () {
       if (Logger._singleton === undefined)
            Logger._ = new Logger();
       return Logger._singleton;
    }

    /**
     * Set the singleton object
     * @param {Logger}
     */
    static set _ (singleton) {
        Logger._singleton = singleton;
    }

    /**
     * Instantiate the Logger
     * @constructor
     * @this {Logger}
     */
    constructor () {
        Logger.ACTIVE = true;
        Logger.MODULES = {
            ROOM:          false,
            ROOMPOSITION:   false,
        };

        Logger.indentation = ["", "  ", "    ", "      ", "        ", "          ", "            ", "              ", "                ", "                ", "                  ", "                    ", "                      ", "                        ", "                          ", "                            ", "                              ", "                                ", "                                  ", "                                    ", "                                      ", "                                        "];

        Logger.level = 0;
    }

    /**
     * Apply the wrapper to selected functions
     */
    init () {
        if (Logger.ACTIVE && this._init !== true) {
            this._init = true;
            var methods = [];
            if (Logger.MODULES.ROOM) {
                this.wrap('Room', Room, 'find');
                this.wrap('Room', Room, 'findPath');
            }
            if (Logger.MODULES.ROOMPOSITION) {
                this.wrap('RoomPosition', RoomPosition, 'findPathTo');
                this.wrap('RoomPosition', RoomPosition, 'findClosestByPath');
            }
        }
    }

    /**
     * wrap function of class c
     * @param {String} class name
     * @param {Object} class object
     * @param {String} method name
     */
    wrap (LoggerName, c, method) {
        if (Logger.ACTIVE) {
            var f = c.prototype[method];
            c.prototype[method] = function() {
                Logger.functionEnter(LoggerName + '.' + method);

                var tStart      = Game.cpu.getUsed();
                var returnValue = f.apply(this, arguments);
                var tReq        = Game.cpu.getUsed() - tStart;

                Logger.functionExit(LoggerName + '.' + method,  + tReq);

                return returnValue;
            };
        }
    }

    /**
     * log a message
     * @param {String} msg
     */
    static functionEnter (name) {
        Logger.log( '--> ' + name );
        Logger.level ++;
    }

    /**
     * log a message
     * @param {String} msg
     */
    static functionExit (name, tReq) {
        Logger.level --;
        Logger.log( '<-- ' + name  + ' [' + tReq.toFixed(2) + '] ');
    }

    /**
     * log a message
     * @param {String} msg
     */
    static log (msg) {
        console.log( Logger.indentation[Logger.level] + msg );
    }

    /**
     * log a message
     * @param {String} msg
     */
    static logError (msg) {
        console.log( Logger.indentation[Logger.level] + 'ERROR: ' + msg );
    }

    /**
     * log a object
     * @param {String} obj
     */
    static logDebug (obj) {
        console.log( Logger.indentation[Logger.level] + 'DEBUG: ' + JSON.stringify(obj) );
    }

};

module.exports = Logger;
